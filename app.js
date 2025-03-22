const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const path = require("path");
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const questionnaireRoutes = require('./routes/questionnaireRoutes');

const responceRoutes = require('./routes/responseRoutes');

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    process.exit(1);
});

const app = express();

app.use(cors({
    origin: '*',
    methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }));
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/questionnaire', questionnaireRoutes);
app.use('/responce', responceRoutes);
app.use("/uploads", express.static(uploadDir));


app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        const server = http.createServer(app);
        const PORT = process.env.PORT || 8080;
        server.listen(PORT);
    })
    .catch(err => console.log(err));



