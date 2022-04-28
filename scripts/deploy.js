// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Rfid = await hre.ethers.getContractFactory("TrackingContract");
  const rfid = await Rfid.deploy();

  await rfid.deployed();

  console.log("Tracking Contract deployed to:", rfid.address);

  const createInsert = await rfid.insert("TEST123", "Pfizer", "A", "Shipped");
  const receiptInsert = await createInsert.wait();
  //console.log(receiptInsert.events[0].args._uid.toString());

  //get the product shipment producer
  const getProducttxn = await rfid.getShipmentProducer("TEST123");
  const receiptGetProduct = await getProducttxn.wait();
  console.log(receiptGetProduct.events[0].args);

  const getShipmentDetailstxn = await rfid.getShipmentDetails("TEST123");
  const receiptGetShipmentDeets = await getShipmentDetailstxn.wait();

  console.log(receiptGetShipmentDeets.events[0].args);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
