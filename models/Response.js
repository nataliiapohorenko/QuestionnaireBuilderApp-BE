const mongoose = require("mongoose");

const ResponseSchema = new mongoose.Schema({
    questionnaireId: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire" },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Questionnaire.questions" },
        answer: mongoose.Schema.Types.Mixed
      }
    ],
    completionTime: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Response", ResponseSchema);
