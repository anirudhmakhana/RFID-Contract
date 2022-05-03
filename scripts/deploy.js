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

  const insertOne = [
    "TEST123",
    "Stainless Steel 2 rolls",
    "A",
    "B",
    "C",
    "YORU",
    "Shipped",
    12345678,
  ];
  const insertTwo = [
    "TEST456",
    "PS5 2EA, Nintendo Switch 1EA",
    "A",
    "B",
    "C",
    "YORU",
    "Shipped",
    12345678,
  ];
  const updateOne = [
    "TEST123",
    "Stainless Steel 2 rolls",
    "A",
    "C",
    "C",
    "YORU",
    "Done",
    12345678,
  ];

  const createInsert = await rfid.insert(insertOne);
  const receiptInsert = await createInsert.wait();
  console.log(receiptInsert.events[0]);

  const createInsertTwo = await rfid.insert(insertTwo);
  const receiptInsertTwo = await createInsertTwo.wait();
  console.log(receiptInsertTwo.events[0]);

  const updateShipment = await rfid.updateStatus(updateOne);
  updateShipmentReceipt = await updateShipment.wait();
  console.log(updateShipmentReceipt.events[0]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
