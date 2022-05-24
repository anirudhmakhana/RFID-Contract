let express = require('express'),
    router = express.Router()

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
const Shipment = require("../models/shipment")
const ScanData = require("../models/scanData")
const Node = require("../models/node")
const mysql = require('mysql2');
const sequelize = require('../database');
const ShipmentScan = require('../models/shipmentScan');
const abiDecoder = require('abi-decoder');
const connection = mysql.createConnection( {
    host: 'localhost',
    user: process.env.DB_USER,
    password:  process.env.DB_PASS,
    database:process.env.DB_NAME,
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
    Shipment.findAll()
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No shipment found!"})
        } else {
        
            var shipments = JSON.stringify(results )
            shipments = JSON.parse(shipments)
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
                let origin = await Node.findOne( {where:{nodeCode:shipment.originNode}})
                if (origin) {
                    shipments[i].companyCode = origin.companyCode
                }
            }
            res.status(200).json(result_ship)

        }
    })
    // , [sequelize.col('ScanData.scannedAt'), 'currentNode'],[ sequelize.col('ScanData.status'), 'status']],
    // include: [{model:ScanData, where:{txnHash : sequelize.col('Shipment.txnHash')},  attributes:['scannedAt', 'status']}, {model:Node, attributes:['companyCode']}]})
    
    .catch( error => {
        res.status(400).json( {error: error.message})

    })

})

router.route('/:uid').get(auth, async (req,res) => {
    Shipment.findOne( {where:{uid: req.params.uid}})
    .then (async results => {
        if (!results ) { 
            res.status(404).json( {error: "No shipment found!"})
        } else {
            var shipment = JSON.stringify(results )
            shipment = JSON.parse(shipment)
            let scan = await ScanData.findOne( {where:{txnHash:shipment.txnHash}})
            if ( scan ) {
                shipment.currentNode = scan.scannedAt
                shipment.status = scan.status
                shipment.nextNode = scan.nextNode
            }
            let origin = await Node.findOne( {where:{nodeCode:shipment.originNode}})
            if (origin) {
                shipment.companyCode = origin.companyCode
            }
            res.status(200).json(shipment)

        }
    })
    // , [sequelize.col('ScanData.scannedAt'), 'currentNode'],[ sequelize.col('ScanData.status'), 'status']],
    // include: [{model:ScanData, where:{txnHash : sequelize.col('Shipment.txnHash')},  attributes:['scannedAt', 'status']}, {model:Node, attributes:['companyCode']}]})
    
    .catch( error => {
        res.status(400).json( {error: error.message})

    })
})

// return arrived or created shipment
router.route('/stock/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN scanData ON scanData.txnHash = shipments.txnHash JOIN nodes ON nodes.nodeCode = scanData.scannedAt and nodes.companyCode = ? WHERE scanData.status = 'arrived' or scanData.status = 'created'"
    connection.query( query, [req.params.companyCode],async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            var shipments = results
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
            }
            res.status(200).json(result_ship)
        }
    })
})

// return arrived or created shipment in node
router.route('/stock/node/:nodeCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN scanData ON scanData.txnHash = shipments.txnHash WHERE (scanData.status = 'arrived' or scanData.status = 'created') and scanData.scannedAt = ?"
    connection.query( query, [req.params.nodeCode],async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            var shipments = results
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
            }
            res.status(200).json(result_ship)
        }
    })
})

// return shipment of company based on status
router.route('/status/:status/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN scanData ON scanData.txnHash = shipments.txnHash JOIN nodes ON nodes.nodeCode = scanData.scannedAt and nodes.companyCode = ? WHERE scanData.status = ?"
    connection.query( query, [req.params.companyCode,req.params.status],async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            var shipments = results
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
            }
            res.status(200).json(result_ship)
        }
    })
})

// return incomplete shipment by company
router.route('/incomplete/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT shipments.* FROM shipments JOIN scanData ON scanData.txnHash = shipments.txnHash JOIN nodes ON nodes.nodeCode = scanData.scannedAt and nodes.companyCode = ? WHERE scanData.status != 'completed'"
    connection.query( query, [req.params.companyCode], async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            var shipments = results
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
            }
            res.status(200).json(result_ship)
        }
    })
})

// return every shipment that related to the company (originNode, currentNode, destinationNode)
router.route('/related/:companyCode').get(auth, async (req,res) => {
    const query = "SELECT DISTINCT shipments.* FROM shipments JOIN scanData ON scanData.txnHash = shipments.txnHash JOIN nodes ON (nodes.nodeCode = scanData.scannedAt or nodes.nodeCode = shipments.originNode or nodes.nodeCode = shipments.destinationNode) and nodes.companyCode = ?"
    connection.query( query, [req.params.companyCode], async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No shipment found!"});
        } else {
            var shipments = results
            var result_ship = []
            for ( let i = 0; i < shipments.length; i++ ) { 
                let scan = await ScanData.findOne( {where:{txnHash:shipments[i].txnHash}})
                if ( scan ) {
                    shipments[i].currentNode = scan.scannedAt
                    shipments[i].status = scan.status
                    shipments[i].nextNode = scan.nextNode
                    result_ship.push(shipments[i])
                }
            }
            res.status(200).json(result_ship)
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

    const scan_data = 
    {txnHash: transactionHash, 
    scannedAt: originNode,
    status: "created",
    nextNode: null,
    scannedTime: scannedTime}
    const scan_ship_data = 
    {
        uid:uid,
        scanDatumTxnHash: transactionHash
    }
    const shipment_data = {
        uid: uid,
        description: description,
        originNode: originNode,
        destinationNode: destinationNode,
        txnHash: transactionHash
    }
    const newScan = new ScanData(scan_data)
    const newScanShip = new ShipmentScan(scan_ship_data)
    const newShipment = new Shipment(shipment_data)
    newScan.save()
    .then(result => {
        newShipment.save()
        .then( result_ship => {
            newScanShip.save()
            .then( result_scan_ship => {
                res.status(200).json(  shipment_data)
                console.log('Shipment created successfully!', shipment_data)
            })
        })
    })
    .catch(error => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
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
        nextNode: nextNode, companyCode:companyCode, status:status, scannedTime:scannedTime, transactionHash:transactionHash} = req.body

    const scan_data = 
    {txnHash: transactionHash, 
    scannedAt: currentNode,
    status: status,
    nextNode: nextNode,
    scannedTime: scannedTime}
    const scan_ship_data = 
    {
        uid:uid,
        scanDatumTxnHash: transactionHash
    }
    const shipment_data = {
        uid: uid,
        description: description,
        originNode: originNode,
        destinationNode: destinationNode,
        txnHash: transactionHash
    }
    const newScan = new ScanData(scan_data)
    const newScanShip = new ShipmentScan(scan_ship_data)
    Shipment.findOne({where:{uid:uid}})
    .then(result_ship => {

        if ( result_ship ) {
            newScan.save()
            .then(result_scan => {
                result_ship.update(scan_data)
                .then( result_update => {
                    newScanShip.save()
                    .then( result_scan_ship => {
                        res.status(200).json(  shipment_data)
                        console.log('Shipment updated successfully!', scan_ship_data, shipment_data)
                    })
    
            })
        })
        } else {
            res.status(404).json( {error: "No shipment found!"});
        }
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });
    
})

router.route("/audit/:txnHash").get(auth, async (req,res) => {
    web3Initializer()
        .then( tools => {
            // console.log(tools)
        let web3 = tools.web3
        web3.eth.getTransaction(req.params.txnHash, function(err, tx){
            abiDecoder.addABI(contractABI);
            try {
                let tx_data = tx.input;
        
                let decoded_data = abiDecoder.decodeMethod(tx_data);
                let params = decoded_data.params;
            
                let param_values = [];
                label = ['Shipment id', 'Description', 'Origin Node', 'Scanned at', 'Destination Node', 'Producer', 'Status', 'Scanned time']
                for( let i = 0; i < params[0].value.length; i++){
                    if ( label[i].toLowerCase() == 'scanned time') {
                        console.log( new Date(Number(params[0].value[i])).toDateString())
                        param_values.push({label:label[i], val:( new Date(Number(params[0].value[i])).toDateString())})
                    } else if (label[i].toLowerCase() == 'status') {
                        param_values.push({label:label[i], val: params[0].value[i].toUpperCase()})
                    }  else {
                        param_values.push({label:label[i], val: params[0].value[i]})
                    }
                }
                console.log(params)
                res.status(200).json(param_values)
            }
            catch (err) {
                console.log("txn error: ", err)
                res.status(403).json(err)
            }
        })
        
    })
    .catch( err => {
        console.log("txn error: ", err)
        res.status(403).json(err)
    })
    
    
})

module.exports = router;