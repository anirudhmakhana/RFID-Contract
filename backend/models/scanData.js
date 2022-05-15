const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const ScanData = sequelize.define("scanData", {
  txnHash: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  scannedAt: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nextNode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scannedTime: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
});

module.exports = ScanData;