const Questionnaire = require("../models/Questionnaire");
const Response = require("../models/Response");

exports.saveResponce = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers, timeTaken } = req.body;
    
        await Questionnaire.findByIdAndUpdate(id, { $inc: { completions: 1 } });
        const questionnaire = await Questionnaire.findById(id);
        let parsedAnswers = JSON.parse(answers);
        parsedAnswers = parsedAnswers.map((ans) => {
          const file = req.files?.find((f) => f.fieldname === ans.questionId);

          const question = questionnaire.questions.find(
            (q) => q._id.toString() === ans.questionId
          );
    
          return {
            questionId: ans.questionId,
            questionText: question?.text || "Deleted Question",
            type: question?.type || "unknown",
            options: Array.isArray(question?.options)
            ? question.options.map(String)
            : [],
            answer: file ? `/uploads/${file.filename}` : ans.answer,
          };
        });
        const newResponse = new Response({
          questionnaireId: id,
          answers: parsedAnswers,
          completionTime: timeTaken
        });
    
        await newResponse.save();
    
        res.status(201).json({ message: "Response saved successfully"});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
