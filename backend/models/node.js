const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Node = sequelize.define("node", {
    nodeCode: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  companyCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Node;