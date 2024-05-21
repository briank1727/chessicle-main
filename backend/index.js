const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const db = require("./models");
app.use(express.json());
app.use(cors());

// Routers
const todaysPuzzleRouter = require("./routes/TodaysPuzzle");
app.use("/todaysPuzzle", todaysPuzzleRouter);

db.sequelize
  .sync()
  .then(() => {
    app
      .listen(5000, () => {
        console.log("Listening on port 5000");
      })
      .on("error", (error) => {
        console.error(error);
      });
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/", (req, res) => {
  res.json("Wassup");
});
