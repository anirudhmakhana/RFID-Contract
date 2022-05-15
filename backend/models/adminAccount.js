const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const AdminAccount = sequelize.define("adminAccount", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = AdminAccount;