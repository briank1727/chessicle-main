module.exports = (sequelize, DataTypes) => {
  const puzzlesdbs = sequelize.define("puzzlesdbs", {
    fenCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
    },
    numberOfMoves: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  return puzzlesdbs;
};
