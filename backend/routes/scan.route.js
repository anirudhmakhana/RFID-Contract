require('dotenv').config({path:'../../.env'})

let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const mysql = require('mysql2')
const Shipment = require("../models/shipment")
const ScanData = require("../models/scanData")
const Node = require("../models/node")
const sequelize = require('../database');
const ShipmentScan = require('../models/shipmentScan');
const auth = require('../utils/auth')
const admin_auth = require('../utils/admin-auth')
const manager_auth = require('../utils/manager-auth')
const { Op } = require("sequelize");

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
// get all scanData
router.route("/").get(auth, (req, res) => {
    ScanData.findAll()
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No scan data found!"})
        } else {
            var scans = JSON.stringify(results )
            scans = JSON.parse(scans)
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)

        }
    })

})

// create scan data
router.route("/").post(auth, async (req,res) => {
    const { uid: uid, scannedAt: scannedAt, scannedTime: scannedTime, status: status, transactionHash:transactionHash, nextNode:nextNode} = req.body
    const data = {txnHash: transactionHash, 
    scannedAt: originNode,
    status: status,
    nextNode: nextNode,
    scannedTime: scannedTime}
    const newScan = new ScanData(data)
    newScan.save()
    .then( result => {
        res.status(200).json(  data)
        console.log('Scan data uploaded successfully!', data)
    })
    .catch(error => {
        res.status(403).json( {error: error.message})
        console.log("error", error)
    })            
})


// get all scan of node
router.route("/node/:nodeCode").get(auth, (req, res) => {
    ScanData.findAll({where:{scannedAt:req.params.nodeCode}})
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No scan data found!"})
        } else {
            var scans = JSON.stringify(results )
            scans = JSON.parse(scans)
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)

        }
    })
})

// get all scan of node
router.route("/shipment/:shipmentId").get(auth, (req, res) => {
    ScanData.findAll()
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No scan data found!"})
        } else {
            var scans = JSON.stringify(results )
            scans = JSON.parse(scans)
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan && scan.uid == req.params.shipmentId ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)

        }
    })

})

// get stock of node
router.route("/stock/:nodeCode").get(auth, (req, res) => {
    ScanData.findAll({where:{[Op.and]:[{scannedAt:req.params.nodeCode}, {[Op.or]: [{status:'created'}, {status:"arrived"}]}]}})
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No scan data found!"})
        } else {
            var scans = JSON.stringify(results )
            scans = JSON.parse(scans)
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)

        }
    })

})

// get shipping scan of node
router.route("/shipping/:nodeCode").get(auth, (req, res) => {
    ScanData.findAll({where:{[Op.and]:[{scannedAt:req.params.nodeCode}, {status:'shipping'}]}})
    .then (async results => {
        if (results.length < 1 ) { 
            res.status(404).json( {error: "No scan data found!"})
        } else {
            var scans = JSON.stringify(results )
            scans = JSON.parse(scans)
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)

        }
    })

})

// get company scan status 
router.route("/status/:status/:companyCode").get(auth, (req, res) => {
    const query = "SELECT scanData.* FROM scanData JOIN nodes ON nodes.nodeCode = scanData.scannedAt and nodes.companyCode = ? WHERE scanData.status = ?"
    connection.query( query, [ req.params.companyCode, req.params.status], async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No scan data found!"});
        } else {
            var scans = results
            var result_ship = []
            for ( let i = 0; i < scans.length; i++ ) { 
                let scan = await ShipmentScan.findOne( {where:{scanDatumTxnHash:scans[i].txnHash}})
                if ( scan ) {
                    scans[i].uid = scan.uid
                    result_ship.push(scans[i])
                }
            }
            res.status(200).json(result_ship)
        }
    })
})

// router.route("/status/stock/:companyCode").get(auth, (req, res) => {
//     const query = "SELECT scanData.* FROM scanData JOIN shipments ON shipments.txnHash = scanData.txnHash and nodes.companyCode = ? WHERE shipments.status = 'arrived' or scanData.status = 'created'"
//     connection.query( query, [ req.params.companyCode, req.params.status], (error, results) => {
//         if (error) {
//             res.status(400).json( {error: error.message})
//         }
//         else if ( results.length < 1) {
//             res.status(404).json( {error: "No scan data found!"});
//         } else {
//             res.status(200).json(results)
//         }
//     })
// })
module.exports = router;