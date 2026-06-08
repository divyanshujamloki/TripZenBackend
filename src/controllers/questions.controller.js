const Question = require('../models/Question');

exports.listQuestions = async (req, res) => {
  try {
    const filter = req.query.answered === 'false'
      ? { $or: [{ answer: null }, { answer: '' }] }
      : {};
    const questions = await Question.find(filter).populate('tripId', 'title slug');
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.answerQuestion = async (req, res) => {
  try {
    const { answer, isPublic } = req.body;
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { answer, isPublic },
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
