const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    type: { type: String },
    options: { type: [String], default: [] },
    answer: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);


const ResponseSchema = new mongoose.Schema({
    questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire" },
    answers: [AnswerSchema],
    completionTime: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Response", ResponseSchema);
