const express = require("express");
const router = express.Router();
const responceControllers = require('../controllers/responceControllers');
const upload = require("../middlewares/upload");

router.post("/:id", upload.any(), responceControllers.saveResponce);

module.exports = router;
