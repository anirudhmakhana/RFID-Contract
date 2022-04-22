require('dotenv').config({path:'../.env'})
//server file
let express = require('express'),
    mongoose = require('mongoose'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    dbConfig = require('./database/db');


//const artifacts = require('./build/Inbox.json');

//Express route
const companyRoute = require('../backend/routes/company.route');


// Connecting MongoDB 
mongoose.Promise = global.Promise;
// console.log("check", process.env)
mongoose.connect(dbConfig.db, {
    useNewUrlParser: true
}).then( () => {
    console.log('Database successfully connected');
},
    error => {
        console.log('Could not connect to database: ' + error);
    }
)

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(cors());
app.use('/companies', companyRoute);

// PORT
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log('Connected to port ' + port);
})

// 404 error
app.use((req, res, next) => {
    next(createError(404))
})

// Error handler
app.use((err, req, res, next ) => {
    console.error(err.message);
    if ( !err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
})




const appBlockChain = express()
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require("./utils/TrackingContract.json")
const Contract = require('web3-eth-contract');
const provider = new HDWalletProvider([process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_TWO], 'https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b')
const web3 = new Web3(provider)
web3.eth.Contract.setProvider(`https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b`);
var coder = require('axis-web3/lib/solidity/coder')  
var CryptoJS = require('crypto-js')  
const Tx = require('ethereumjs-tx').Transaction
// const accounts = new Accounts("http://127.0.0.1:8545")
const contractAddress = "0xD3Dd4FD11B1Bad20E32436140532869BE2542554"
const contractABI = abi["abi"]
const shipmentContract = new web3.eth.Contract(contractABI, contractAddress)
appBlockChain.use(bodyParser.json());
appBlockChain.use(bodyParser.urlencoded({
    extended: true
}))
appBlockChain.use(cors());
appBlockChain.get("/get-shipment/:id",async (req,res) => {
    var temp = await shipmentContract.methods.getProduct(req.params.id).call(
        { from: "0xf4a6514b99Eac9F938a6441E42F2b985746A7c7D"}
    )
    res.send(temp)
})


appBlockChain.post("/create-shipment/",async (req,res) => {
    console.log("req",req.body)
    const networkId = await web3.eth.net.getId()

    
    var privateKey = new Buffer(process.env.PRIVATE_KEY, 'hex')  
    
    var functionName = 'insert'  
    var types = ['string','string','string','string']  
    var args = [req.body.uid, req.body.productName, req.body.producerName, req.body.shipmentStatus]  
    var fullName = functionName + '(' + types.join() + ')'  
    var signature = CryptoJS.SHA3(fullName,{outputLength:256}).toString(CryptoJS.enc.Hex).slice(0, 8)  
    var dataHex = signature + coder.encodeParams(types, args)  
    var data = '0x'+dataHex  

    var txcount = await web3.eth.getTransactionCount('0xf4a6514b99Eac9F938a6441E42F2b985746A7c7D')
    var nonce = web3.utils.toHex(txcount)  
    console.log(txcount)
    var gasPrice = web3.utils.toHex(web3.eth.gasPrice)
    // var gPrice = await web3.eht.getGasPrice()
    var gasLimitHex = web3.utils.toHex(600000)
    var rawTx = { 'nonce': nonce, 'gasPrice': gasPrice, 'gasLimit': gasLimitHex, 'from': '0xf4a6514b99Eac9F938a6441E42F2b985746A7c7D', 'to': '0xD3Dd4FD11B1Bad20E32436140532869BE2542554', 'data': data}  
    var tx = new Tx(rawTx, {chain:"rinkeby"})  
    // var gas = await tx.estimateGas({from:'0xd7a5506dB374d05EcBA383c5b25fD7e32CBA54a8'})

    var temp = await tx.sign(privateKey)  
    var serializedTx = '0x'+tx.serialize().toString('hex')  
    var signedTx = await web3.eth.accounts.signTransaction(
        rawTx,
        process.env.PRIVATE_KEY
    )
    
    // var result = await shipmentContract.methods.insert(req.body.uid, req.body.productName, req.body.producerName, req.body.shipmentStatus).send(
    //     { from: "0xd7a5506dB374d05EcBA383c5b25fD7e32CBA54a8"}
    // )
    try
    {      
        var result = await web3.eth.sendTransaction(rawTx, function(err, txHash){ res.send(200,{err, txHash}) })
        // var result = await web3.eth.sendSignedTransaction(serializedTx, function(err, txHash){ console.log(err, txHash) })   

        // console.log(web3.eth.getTransaction(result))
    }catch(error) {
            console.log(error)
        }
})

appBlockChain.listen(4010, () => {
    console.log('Connected to port ' + 4010);
})
// console.log(temp)

// if (typeof web3 !== 'undefined') {
//     var web3 = new Web3(web3.currentProvider)
//   } else {
//     var web3 = new Web3(new Web3.providers.HttpProvider(
//         `https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b`))
// }

// const account = web3.eth.getAccounts().then(console.log)