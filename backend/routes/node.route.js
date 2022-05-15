require('dotenv').config({path:'../../.env'})

let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const mysql = require('mysql2')
const Node = require("../models/node")
const ScanData = require("../models/scanData")

const auth = require('../utils/auth')
const admin_auth = require('../utils/admin-auth')
const manager_auth = require('../utils/manager-auth')

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


// Read nodes
router.route("/").get(auth, (req, res) => {
    Node.findAll()
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })
})

// Read active nodes
router.route("/active/").get(auth, (req, res) => {
    AdminAccount.findAll({where:{status:"active"}})
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })

})

//create node
router.route("/").post(auth, async (req, res) => {
    const {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status } = req.body
    // try {
    const data = {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status }
    const newNode = new Node(data)
    newNode.save()
    .then(result => {
        res.status(200).json(  data)
        console.log('Node created successfully!', data)
    })
    .catch(error => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    })

})

// update node
router.route("/update/:nodeCode").put(auth, async (req, res) => {
    const {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status } = req.body

    // try {
    const data = {nodeCode: nodeCode, companyCode: companyCode, address:address, 
        lat: lat, lng: lng, phoneNumber: phoneNumber, status: status }
    
    Node.findOne({where:{nodeCode:req.params.nodeCode}})
    .then( result => {
        if ( result ) {
            result.update(data)
            .then( response => {
                res.status(200).json(  data)
                console.log('Node updated successfully!', data)
        })
        } else {
            res.status(404).json( {error: "No node found!"});
        }
        
        
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });
})

router.route("/update/status/:nodeCode").patch(auth, async (req, res) => {
    const {nodeCode: nodeCode, status: status } = req.body

    // try {
    const data = { status: status }
    
    Node.findOne({where:{nodeCode:req.params.nodeCode}})
    .then( result => {
        if ( result ) {
            result.update(data)
            .then( response => {
                res.status(200).json(  data)
                console.log('Node updated successfully!', data)
        })
        } else {
            res.status(404).json( {error: "No node found!"});
        }
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });

})

// delete node by nodeCode
router.route("/:nodeCode").delete(auth, (req, res) => {
    Node.destroy({ where: {companyCode:req.params.nodecOde}})
    .then( result => {
        res.status(200).json({message:`Node ${req.params.nodeCode} is deleted.`})
    } )
    .catch( error => {
        res.status(400).json( {error: error.message})
    })

})

// return node that related to the shipment (currentNode or used to be)
router.route('/related/:shipmentId').get(auth, async (req,res) => {
    ScanData.aggregate('scannedAt', 'DISTINCT', { plain: false, where:{uid:req.params.shipmentId} } )
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })

})

// get node by nodeCode
router.route("/:nodeCode").get(auth, (req, res) => {
    Node.findOne({where:{nodeCode:req.params.nodeCode}})
    .then( result => {
        if ( result ) {
            res.status(200).json(result)
        }
        else {
            res.status(404).json( {error: "No node found!"});
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
})


// Read nodes of company
router.route("/bycompany/:companyCode").get(auth, (req, res) => {
    Node.findAll({where:{companyCode:req.params.companyCode}})
    .then( results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
})

// have stocking shipment that have the same destination
router.route('/stock/samedestination/:destinationNode').get(auth, async (req,res) => {
    const query = "SELECT DISTINCT scanData.scannedAt FROM scanData JOIN shipments ON scanData.txnHash = shipments.txnHash and shipments.destinationNode = ? WHERE scanData.status != 'shipping' and scanData.status != 'completed'"
    connection.query( query, [req.params.destinationNode], (error, results) => {
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

// Read active nodes of company
router.route("/active/:companyCode").get(auth, (req, res) => {
    Node.findAll({where:{companyCode: req.params.companyCode, status:"active"}})
    .then( results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
 
})

module.exports = router;