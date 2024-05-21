const express = require("express");
const router = express.Router();
const { puzzlesdbs } = require("../models");

router.get("/:date", async (req, res) => {
  const date = req.params.date;
  const todaysPuzzle = await puzzlesdbs.findAll({ where: { date: date } });
  res.json(todaysPuzzle);
});

module.exports = router;
