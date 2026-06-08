const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const normalizeEmail = (email) => email?.toLowerCase().trim();

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role === 'admin' ? 'admin' : 'user',
});

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, phone, passwordHash });
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const freshUser = await User.findById(user._id).lean();
    const token = signToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: toPublicUser(freshUser),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = (req, res) => {
  res.json({ user: toPublicUser(req.user) });
};
