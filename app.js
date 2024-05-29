const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const getModel = require("./models/GenericModel");

const app = express();
const port = 3000;

const DATABASE_CONNECTION_STRING = "mongodb://127.0.0.1:27017/getCSVData";
mongoose
  .connect(DATABASE_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const results = [];
  fs.createReadStream(file.path)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const collections = {};

      results.forEach((row) => {
        const { collectionName, ...data } = row;
        if (!collections[collectionName]) {
          collections[collectionName] = [];
        }
        collections[collectionName].push(data);
      });

      const savePromises = Object.keys(collections).map(
        async (collectionName) => {
          const model = getModel(collectionName, {});
          await model.insertMany(collections[collectionName]);
        }
      );

      Promise.all(savePromises)
        .then(() => {
          res.send("File uploaded and data saved to MongoDB.");

          fs.unlinkSync(file.path);
        })
        .catch((err) => {
          console.error("Error saving data to MongoDB:", err);
          res.status(500).send("Error saving data to MongoDB.");
        });
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
