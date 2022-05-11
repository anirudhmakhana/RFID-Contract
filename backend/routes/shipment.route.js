let express = require('express'),
    router = express.Router()
const   createError = require('http-errors');

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider')
const abi = require("../utils/TrackingContract.json")
const Contract = require('web3-eth-contract');

var coder = require('axis-web3/lib/solidity/coder')  
var CryptoJS = require('crypto-js')  
const Tx = require('ethereumjs-tx').Transaction
const contractAddress = "0x70CB7E6DEFd1a235Ff11a45e4a382F6E0dFC7DB7"
const contractABI = abi["abi"]
const auth = require('../utils/auth')

const mysql = require('mysql')

const connection = mysql.createConnection( {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database:'company_user_data',
    port: 8889
})

connection.connect((err) => {
    if (err) {
        console.log("MySQL connection error : ", err)
        return 
    }
    console.log("MySQL successfully connected.")
})

async function web3Initializer() {
    const query = "SELECT walletPrivateKey FROM companies"

    return new Promise((resolve, reject) => {
        connection.query( query, (error, results) => {
            if (error) {
                throw error
            }
            else if ( results.length < 1) {
                throw "No company found"
            } else {
                let allKeys = []
                for (let i = 0; i < results.length; i++ ){
                    allKeys.push(results[i].walletPrivateKey)
                }
                console.log(allKeys)
                let provider = new HDWalletProvider( allKeys,'https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b')
                let web3 = new Web3(provider)
                web3.eth.Contract.setProvider(`https://rinkeby.infura.io/v3/6c9af8d40e4d4ff0bad46e193bc1aa8b`);
                let shipmentContract = new web3.eth.Contract(contractABI, contractAddress)
                return resolve({ web3: web3, shipmentContract: shipmentContract})
            }
        })
      });


}

// get all shipments from SQL
router.route("/").get(auth, (req, res) => {
    const query = "SELECT * FROM shipments"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            res.status(200).json(results)
        }
    })

})

router.route('/:id').get(auth, async (req,res) => {
    const query = "SELECT * FROM shipments WHERE uid = ?"
    connection.query( query, [req.params.id], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            res.status(200).json(results[0])
        }
    })
})

// return arrived or created shipment
router.route('/stock/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN nodes ON nodes.nodeCode = shipments.currentNode and nodes.companyCode = ? WHERE shipments.status = 'arrived' or shipments.status = 'created'"
    connection.query( query, [req.params.companyCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

// return shipment of company based on status
router.route('/status/:status/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN nodes ON nodes.nodeCode = shipments.currentNode and nodes.companyCode = ? WHERE shipments.status = ?"
    connection.query( query, [req.params.companyCode, req.params.status], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

// return incomplete shipment by company
router.route('/incomplete/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN nodes ON nodes.nodeCode = shipments.currentNode and nodes.companyCode = ? WHERE shipments.status != 'completed'"
    connection.query( query, [req.params.companyCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

//get shipment by id and wallet address(publickey)
router.route('/contract/:id/:address').get(auth, async (req,res) => {
    try {
        web3Initializer()
        
        .then( tools => {
            // console.log(tools)
        let web3 = tools.web3
        let shipmentContract = tools.shipmentContract
        shipmentContract.methods.getShipmentsByUID(req.params.id).call(
            { from: req.params.address})
            .then( result => res.status(200).json(result ))
            .catch( err => {
                console.log(err)
                res.status(403).json(err)
            })
        })
        .catch( err => {
            console.log(err)
            res.status(403).json(err)
        })
    } catch( err) {
        console.log(err)
        res.status(403).json(err)
    }
    
    
    
})

//create shipment
router.route("/").post(auth, async (req,res) => {
    console.log("req",req.body)
    // const networkId = await web3.eth.net.getId()
    // var privateKey = new Buffer(req.body.walletPrivateKey, 'hex')
    web3Initializer()
    .then( async tools => {
        // console.log(tools)
        let web3 = tools.web3
        let shipmentContract = tools.shipmentContract
        var functionName = "insert"  
        var types = ["string","string","string","string","string","string","string","uint256"]
        var args = [req.body.uid, req.body.description, req.body.originNode, req.body.currentNode, req.body.destinationNode,
             req.body.companyCode, req.body.status , req.body.scannedTime]
        console.log(args) 
        var fullName = functionName + '(' + types.join() + ')'  
        var signature = CryptoJS.SHA3(fullName,{outputLength:256}).toString(CryptoJS.enc.Hex).slice(0, 8)  
        var data = web3.eth.abi.encodeFunctionCall(contractABI[4], 
            [[req.body.uid, req.body.description, req.body.originNode, req.body.currentNode, req.body.destinationNode,
            req.body.companyCode, req.body.status , req.body.scannedTime]]);

        var txcount = await web3.eth.getTransactionCount(req.body.walletPublicKey).catch((err) =>  res.status(403).json( err ))


        var nonce = web3.utils.toHex(txcount)  
        var gasPrice = web3.utils.toHex(web3.eth.gasPrice)
        var gasLimitHex = web3.utils.toHex(600000)
        var rawTx = { 'nonce': nonce, 'gasPrice': gasPrice, 'gasLimit': gasLimitHex, 'from': req.body.walletPublicKey, 'to': contractAddress, 'data': data}  
        web3.eth.sendTransaction(rawTx)
        .then(result => {
            res.status(200).json( {transactionHash:result.transactionHash})
        })
        .catch(err => {
            res.status(403).json( {error: err})
        })
    })
    .catch( err => {
        console.log("txn error: ", err)
        res.status(403).json(err)
    })
    
    
})

router.route("/centralize/").post(auth, async (req,res) => {
    const { uid: uid, description: description, 
        originNode: originNode, currentNode: currentNode, destinationNode:destinationNode,
        companyCode:companyCode, status:status, scannedTime:scannedTime, transactionHash:transactionHash} = req.body
    const data = { uid: uid,
        description: description, 
        originNode: originNode,
        currentNode: currentNode,
        destinationNode:destinationNode,
        companyCode:companyCode,
        status:status,
        scannedTime:scannedTime, 
        transactionHash:transactionHash}
    const query = "INSERT INTO shipments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);"
    connection.query(query,  Object.values(data), (error) => {
        if (error) {
            res.status(400).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json( data )
        }
    })      
    
})

//update shipment
router.route("/update/").put(auth, async (req,res) => {
    console.log("req",req.body)
    web3Initializer()
    .then( async tools => {
        let web3 = tools.web3
    
        var data = web3.eth.abi.encodeFunctionCall(contractABI[8], 
            [[req.body.uid, req.body.description, req.body.originNode, req.body.currentNode, req.body.destinationNode,
            req.body.companyCode, req.body.status , req.body.scannedTime]]);

        var txcount = await web3.eth.getTransactionCount(req.body.walletPublicKey).catch((err) =>  res.status(403).json( err ))


        var nonce = web3.utils.toHex(txcount)  
        var gasPrice = web3.utils.toHex(web3.eth.gasPrice)
        var gasLimitHex = web3.utils.toHex(600000)
        var rawTx = { 'nonce': nonce, 'gasPrice': gasPrice, 'gasLimit': gasLimitHex, 'from': req.body.walletPublicKey, 'to': contractAddress, 'data': data}     
        web3.eth.sendTransaction(rawTx)
        .then(result => {
            res.status(200).json( {transactionHash:result.transactionHash})
        })
        .catch(err => {
            res.status(403).json( {error: err})
        })
        
    })
    .catch( err => {
        console.log("txn error: ", err)
        res.status(403).json(err)
    })
    
})

router.route("/centralize/update/").put(auth, async (req,res) => {
    const { uid: uid, description: description, 
        originNode: originNode, currentNode: currentNode, destinationNode:destinationNode,
        companyCode:companyCode, status:status, scannedTime:scannedTime, transactionHash:transactionHash} = req.body
    const data = { uid: uid,
        description: description, 
        originNode: originNode,
        currentNode: currentNode,
        destinationNode:destinationNode,
        companyCode:companyCode,
        status:status,
        scannedTime:scannedTime, 
        transactionHash:transactionHash}
    const query = `UPDATE shipments SET uid='${uid}', description='${description}', originNode='${originNode}', currentNode='${currentNode}',
    destinationNode='${destinationNode}', companyCode='${companyCode}', status='${status}', scannedTime='${scannedTime}', txnHash='${transactionHash}'
    WHERE uid = '${uid}'`

    connection.query(query, (error) => {
        if (error) {
            res.status(400).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json( data )
        }
    })      
    
})


module.exports = router;