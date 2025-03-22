const Questionnaire = require("../models/Questionnaire");
const Response = require("../models/Response");

exports.getAllQuestionnaires = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const sortBy = req.query.sortBy || "createdAt";
    const skip = (page - 1) * limit;
  
    try {
      let sort = {};
  
      switch (sortBy) {
        case "name":
          sort = { name: 1 };
          break;
        case "completions":
          sort = { completions: -1 };
          break;
        case "createdAt":
          sort = { createdAt: -1 };
          break;
        case "questionsCount":
          const total = await Questionnaire.countDocuments();
  
          const questionnaires = await Questionnaire.aggregate([
            {
              $addFields: {
                questionsCount: { $size: "$questions" },
              },
            },
            { $sort: { questionsCount: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                description: 1,
                completions: 1,
                questionsCount: 1,
                createdAt: 1,
              },
            },
          ]);
  
          return res.json({ questionnaires, total });
      }
      const total = await Questionnaire.countDocuments();
      const questionnaires = await Questionnaire.find()
        .sort(sort)
        .skip(skip)
        .limit(limit);
  
      const modified = questionnaires.map((q) => ({
        _id: q._id,
        name: q.name,
        description: q.description,
        completions: q.completions,
        questionsCount: q.questions.length,
        createdAt: q.createdAt,
      }));
  
      res.json({ questionnaires: modified, total });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
  

exports.getQuestionnaireById = async (req, res, next) => {
    try {
        const questionnaire = await Questionnaire.findById(req.params.id);
        if (!questionnaire) {
            const error = new Error('Could not find questionnaire.');
            error.statusCode = 404;
            throw error;
        }
        res.json(questionnaire);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
  }

exports.createQuestionnaire = async (req, res, next) => {
    try {
        const createdQuestionnaire = await Questionnaire.create(req.body);
        res.status(201).json(createdQuestionnaire);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateQuestionnaire = async (req, res, next) => {
    try {
        const updatedQuestionnaire = await Questionnaire.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedQuestionnaire) {
            const error = new Error('Could not find questionnaire.');
            error.statusCode = 404;
            throw error;
        }
        res.json(updatedQuestionnaire);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.deleteQuestionnaire = async (req, res, next) => {
    try {
        const deletedQuestionnaire = await Questionnaire.findByIdAndDelete(req.params.id);
        if (!deletedQuestionnaire) {
            const error = new Error('Could not find questionnaire.');
            error.statusCode = 404;
            throw error;
        }
        res.json({ message: "Success" });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getStatistics = async (req, res, next) => {
    const questionnaireId = req.params.id;
    try {
        const responses = await Response.find({ questionnaireId });
        if (responses.length === 0) return res.json({ avgTime: 0, completions: [], charts: [] });
        
        const avgTime = Math.round(
            responses.reduce((sum, r) => sum + r.completionTime, 0) / responses.length
        );

        const completionsByDate = {};
        responses.forEach((r) => {
            const day = new Date(r.createdAt).toISOString().slice(0, 10);
            completionsByDate[day] = (completionsByDate[day] || 0) + 1;
        });

        const questionMap = {};
        responses.forEach((r) => {
            r.answers.forEach(({ questionId, answer }) => {
                if (!questionMap[questionId]) questionMap[questionId] = {};
                const key = Array.isArray(answer) ? answer : [answer];
                key.forEach((val) => {
                questionMap[questionId][val] = (questionMap[questionId][val] || 0) + 1;
                });
            });
        });

        const questionnaire = await Questionnaire.findById(questionnaireId);
        const piecharts = questionnaire.questions.map((q) => ({
            question: q.text,
            data: Object.entries(questionMap[q._id] || {}).map(([option, count]) => ({
                name: option,
                value: count,
            })),
        }));

        res.json({
            avgTime,
            completions: completionsByDate,
            piecharts,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch statistics." });
    }
};
