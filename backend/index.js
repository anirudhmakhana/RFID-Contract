require("dotenv").config({ path: "../.env" });
//server file
let express = require("express"),
  cors = require("cors"),
  bodyParser = require("body-parser")
  // dbConfig = require("./database");

const createError = require('http-errors');
const AdminAccount = require("./models/adminAccount")
const StaffAccount = require("./models/staffAccount")
const Company = require("./models/company")
const Node = require("./models/node")
const ScanData = require("./models/scanData")
const Shipment = require("./models/shipment");
const ShipmentScan = require("./models/shipmentScan");

StaffAccount.belongsTo(Company, { foreignKey: 'companyCode' });
Node.belongsTo(Company, { foreignKey: 'companyCode' });
Shipment.belongsTo(Node, {foreignKey: 'originNode'});
Shipment.belongsTo(Node, {foreignKey: 'destinationNode'});
Shipment.belongsToMany(ScanData, { through: ShipmentScan, foreignKey: 'uid' });
ScanData.belongsTo(Node, {foreignKey: 'scannedAt'});
ScanData.belongsTo(Node, {foreignKey: 'nextNode'});
// ScanData.belongsTo(Shipment, {foreignKey: 'uid'});

// Company.hasMany(StaffAccount, { foreignKey: 'companyCode' });
//Express route
const companyRoute = require("../backend/routes/company.route");
const adminRoute = require("../backend/routes/admin.route");
const shipmentRoute = require("../backend/routes/shipment.route");
const staffRoute = require("../backend/routes/staff.route");
const nodeRoute = require("../backend/routes/node.route");
const scanRoute = require("../backend/routes/scan.route");

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use("/admin", adminRoute);
app.use("/company", companyRoute);
app.use("/staff", staffRoute);
app.use("/shipment", shipmentRoute);
app.use("/node", nodeRoute);
app.use("/scan", scanRoute);
// PORT
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log("Connected to port " + port);
});

// 404 error
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).send(err.message);
});

