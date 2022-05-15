const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Company = sequelize.define("companies", {
  companyCode: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  walletPublicKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  walletPrivateKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Company;