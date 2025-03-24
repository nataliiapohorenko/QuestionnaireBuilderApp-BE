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

function mergeQuestions(existingQuestions, updatedQuestions) {
    const result = [];
    console.log("Updated questions received:", updatedQuestions.map(q => q._id));
    for (const updated of updatedQuestions) {
      if (updated._id) {
        const existing = existingQuestions.find(
          (q) => q._id.toString() === updated._id.toString()
        );
  
        if (existing) {
          existing.text = updated.text;
          existing.type = updated.type;
          existing.options = Array.isArray(updated.options) ? updated.options : [];
          result.push(existing);
          continue;
        }
        const { text, type, options } = updated;
        result.push({
          text,
          type,
          options: Array.isArray(options) ? options : [],
        });
      } else {
        const { text, type, options } = updated;
        result.push({
          text,
          type,
          options: Array.isArray(options) ? options : [],
        });
      }
    }
  
    return result;
  }
  
  

exports.updateQuestionnaire = async (req, res, next) => {
    try {
      const questionnaire = await Questionnaire.findById(req.params.id);
      if (!questionnaire) {
        const error = new Error("Could not find questionnaire.");
        error.statusCode = 404;
        throw error;
      }
      if (req.body.name !== undefined) questionnaire.name = req.body.name;
      if (req.body.description !== undefined) questionnaire.description = req.body.description;
      if (Array.isArray(req.body.questions)) {
        questionnaire.questions = mergeQuestions(
          questionnaire.questions,
          req.body.questions
        );
      }
  
      const updated = await questionnaire.save();
      res.json(updated);
    } catch (err) {
      if (!err.statusCode) err.statusCode = 500;
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
        const questionnaire = await Questionnaire.findById(questionnaireId);
        const questionTextMap = new Map();

        questionnaire.questions.forEach((q) => {
        questionTextMap.set(q._id.toString(), q.text);
        });

        const responses = await Response.find({ questionnaireId });
        if (responses.length === 0) return res.json({ avgTime: 0, completions: [], charts: [] });
        
        const avgTime = Math.round(
            responses.reduce((sum, r) => sum + r.completionTime, 0) / responses.length
        );

        const completionsByDay = {};
        const completionsByWeek = {};
        const completionsByMonth = {};

        responses.forEach((r) => {
        const date = new Date(r.createdAt);

        const day = date.toISOString().slice(0, 10);
        completionsByDay[day] = (completionsByDay[day] || 0) + 1;

        const year = date.getFullYear();
        const janFirst = new Date(year, 0, 1);
        const days = Math.floor((date - janFirst) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + janFirst.getDay() + 1) / 7);
        const weekKey = `${year}-W${String(week).padStart(2, "0")}`;
        completionsByWeek[weekKey] = (completionsByWeek[weekKey] || 0) + 1;

        const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        completionsByMonth[monthKey] = (completionsByMonth[monthKey] || 0) + 1;
        });


        const pieMap = new Map();

        responses.forEach((r) => {
            if (Array.isArray(r.answers)) {
                r.answers.forEach(({ questionId, questionText, answer }) => {
                    if (!questionId) return;

                    const key = questionId.toString();

                    if (!pieMap.has(key)) {
                        pieMap.set(key, {
                        questionText: questionText || "Unknown question",
                        counts: new Map()
                        });
                    }

                    const entry = pieMap.get(key);
                    const answersArray = Array.isArray(answer) ? answer : [answer];

                    answersArray.forEach((ans) => {
                        entry.counts.set(ans, (entry.counts.get(ans) || 0) + 1);
                    });
                });
            }
        });


        const piecharts = Array.from(pieMap.entries()).map(([questionId, { questionText, counts }]) => {
            const latestText = questionTextMap.get(questionId);
            const label = latestText
              ? latestText
              : `${questionText} (Deleted or Old Question)`;
          
            return {
              question: label,
              data: Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
            };
          });
          
          

        res.json({
            avgTime,
            completions: completionsByDay,
            completionsByWeek,
            completionsByMonth,
            piecharts,
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
