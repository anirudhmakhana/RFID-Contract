let express = require("express"),
  router = express.Router();
const createError = require("http-errors");

const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const abi = require("../utils/TrackingContract.json");
const Contract = require("web3-eth-contract");
const provider = new HDWalletProvider(
  [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_TWO],
  "https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b"
);
const web3 = new Web3(provider);
web3.eth.Contract.setProvider(
  `https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b`
);
var coder = require("axis-web3/lib/solidity/coder");
var CryptoJS = require("crypto-js");
const Tx = require("ethereumjs-tx").Transaction;
const contractAddress = "0xD3Dd4FD11B1Bad20E32436140532869BE2542554";
const contractABI = abi["abi"];
const shipmentContract = new web3.eth.Contract(contractABI, contractAddress);
const auth = require("../utils/auth");

//get shipment by id and wallet address(publickey)
router.route("/:id/:address").get(auth, async (req, res) => {
  var temp = await shipmentContract.methods
    .getProduct(req.params.id)
    .call({ from: req.params.address });
  res.send(200, temp);
});

//create shipment
router.route("/").post(auth, async (req, res) => {
  console.log("req", req.body);
  // const networkId = await web3.eth.net.getId()
  // var privateKey = new Buffer(req.body.walletPrivateKey, 'hex')

  var functionName = "insert";
  var types = ["string", "string", "string", "string"];
  var args = [
    req.body.uid,
    req.body.productName,
    req.body.producerName,
    req.body.shipmentStatus,
  ];
  var fullName = functionName + "(" + types.join() + ")";
  var signature = CryptoJS.SHA3(fullName, { outputLength: 256 })
    .toString(CryptoJS.enc.Hex)
    .slice(0, 8);
  var dataHex = signature + coder.encodeParams(types, args);
  var data = "0x" + dataHex;

  var txcount = await web3.eth.getTransactionCount(req.body.walletPublicKey);
  var nonce = web3.utils.toHex(txcount);
  console.log(txcount);
  var gasPrice = web3.utils.toHex(web3.eth.gasPrice);
  // var gPrice = await web3.eht.getGasPrice()
  var gasLimitHex = web3.utils.toHex(600000);
  var rawTx = {
    nonce: nonce,
    gasPrice: gasPrice,
    gasLimit: gasLimitHex,
    from: req.body.walletPublicKey,
    to: contractAddress,
    data: data,
  };
  // var tx = new Tx(rawTx, {chain:"rinkeby"})
  // var gas = await tx.estimateGas({from:'0xd7a5506dB374d05EcBA383c5b25fD7e32CBA54a8'})

  // var temp = await tx.sign(privateKey)
  // var serializedTx = '0x'+tx.serialize().toString('hex')
  // var signedTx = await web3.eth.accounts.signTransaction(
  //     rawTx,
  //     req.body.walletPrivateKey
  // )

  // var result = await shipmentContract.methods.insert(req.body.uid, req.body.productName, req.body.producerName, req.body.shipmentStatus).send(
  //     { from: "0xd7a5506dB374d05EcBA383c5b25fD7e32CBA54a8"}
  // )
  try {
    var result = await web3.eth.sendTransaction(rawTx, function (err, txHash) {
      res.send(200, { err, txHash });
    });
    // var result = await web3.eth.sendSignedTransaction(serializedTx, function(err, txHash){ console.log(err, txHash) })

    // console.log(web3.eth.getTransaction(result))
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
