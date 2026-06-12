const cloudinary = require("../config/cloudinary");
const Media = require("../models/Media");

const ALLOWED_TYPES = ["image", "video"];

const uploadToCloudinary = (file, options) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, options);
};

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { type, caption } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ message: "type must be image or video" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "file is required" });
    }

    const isImage = req.file.mimetype.startsWith("image/");
    const isVideo = req.file.mimetype.startsWith("video/");
    if (type === "image" && !isImage) {
      return res
        .status(400)
        .json({ message: "Uploaded file must be an image" });
    }
    if (type === "video" && !isVideo) {
      return res.status(400).json({ message: "Uploaded file must be a video" });
    }

    const folder = `tripzen/${req.user._id}/${type}`;
    const result = await uploadToCloudinary(req.file, {
      folder,
      resource_type: type === "video" ? "video" : "image",
      fetch_format: "auto",
      quality: "auto",
    });

    const media = await Media.create({
      userId: req.user._id,
      type,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      originalName: req.file.originalname,
      caption: caption || undefined,
    });

    res.status(201).json({ media });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listMedia = async (req, res) => {
  try {
    const { type, tripId, userId } = req.query;
    const filter = {};

    if (req.user.role === "admin") {
      if (userId) filter.userId = userId;
    } else {
      filter.userId = req.user._id;
    }

    if (type) filter.type = type;
    if (tripId) filter.tripId = tripId;

    const media = await Media.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ media, total: media.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate(
      "userId",
      "name email",
    );
    if (!media) return res.status(404).json({ message: "Media not found" });

    const ownerId = media.userId?._id || media.userId;
    if (
      ownerId?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ media });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    if (
      media.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await cloudinary.uploader.destroy(media.publicId, {
      resource_type: media.type === "video" ? "video" : "image",
    });
    await media.deleteOne();

    res.json({ message: "Media deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
