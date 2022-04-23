require("dotenv").config({ path: "../.env" });
//server file
let express = require("express"),
  mongoose = require("mongoose"),
  cors = require("cors"),
  bodyParser = require("body-parser"),
  dbConfig = require("./database/db");

//const artifacts = require('./build/Inbox.json');

//Express route
const companyRoute = require("../backend/routes/company.route");
const shipmentRoute = require("../backend/routes/shipment.route");

// Connecting MongoDB
mongoose.Promise = global.Promise;
// console.log("check", process.env)
mongoose
  .connect(dbConfig.db, {
    useNewUrlParser: true,
  })
  .then(
    () => {
      console.log("Database successfully connected");
    },
    (error) => {
      console.log("Could not connect to database: " + error);
    }
  );

const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use("/companies", companyRoute);

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

const appBlockChain = express();

appBlockChain.use(bodyParser.json());
appBlockChain.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
appBlockChain.use(cors());
appBlockChain.use("/shipments", shipmentRoute);

appBlockChain.listen(4010, () => {
  console.log("Connected to port " + 4010);
});
