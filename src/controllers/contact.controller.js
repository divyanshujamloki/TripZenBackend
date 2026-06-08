exports.contact = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;
    if (!fullName || !email || !message) {
      return res.status(400).json({ message: 'fullName, email, message are required' });
    }
    console.log('Contact form:', { fullName, email, phone, message });
    res.status(201).json({ message: 'Message received. We will get back to you soon.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
