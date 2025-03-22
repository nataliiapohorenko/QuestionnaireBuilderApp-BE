const express = require("express");
const Questionnaire = require("../models/Questionnaire");
const router = express.Router();
const questionnaireControllers = require("../controllers/questionnaireControllers")

router.get("/", questionnaireControllers.getAllQuestionnaires);

router.post("/", questionnaireControllers.createQuestionnaire);

router.get("/:id", questionnaireControllers.getQuestionnaireById);

router.delete("/:id", questionnaireControllers.deleteQuestionnaire);

router.put("/:id", questionnaireControllers.updateQuestionnaire);

router.get("/statistics/:id", questionnaireControllers.getStatistics)

module.exports = router;
