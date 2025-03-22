const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  text: String,
  type: String,
  options: [String],
});

const QuestionnaireSchema = new mongoose.Schema({
  name: String,
  description: String,
  questions: [QuestionSchema],
  completions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Questionnaire", QuestionnaireSchema);
