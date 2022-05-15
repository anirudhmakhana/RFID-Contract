const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const StaffAccount = sequelize.define("staffAccount", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  positionLevel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = StaffAccount;