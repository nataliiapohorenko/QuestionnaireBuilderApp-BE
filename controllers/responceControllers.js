const Questionnaire = require("../models/Questionnaire");
const Response = require("../models/Response");

exports.saveResponce = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answers, timeTaken } = req.body;
    
        await Questionnaire.findByIdAndUpdate(id, { $inc: { completions: 1 } });
        let parsedAnswers = JSON.parse(answers);
        parsedAnswers = parsedAnswers.map((ans) => {
          const file = req.files.find((f) => f.fieldname === ans.questionId);
          if (file) {
            return {
              questionId: ans.questionId,
              answer: `/uploads/${file.filename}`,
            };
          }
          return ans;
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
