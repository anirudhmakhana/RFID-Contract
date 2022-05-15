const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Shipment = sequelize.define("shipment", {
  uid: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originNode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destinationNode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  txnHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Shipment;