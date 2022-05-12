require('dotenv').config({path:'../../.env'})

let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const createError = require('http-errors');
const mysql = require('mysql')
const auth = require('../utils/auth')
const admin_auth = require('../utils/admin-auth')
const manager_auth = require('../utils/manager-auth')

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


// Read nodes
router.route("/").get(auth, (req, res) => {
    const query = "SELECT * FROM nodes"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })

})

// Read active nodes
router.route("/active/").get(auth, (req, res) => {
    const query = "SELECT * FROM nodes WHERE status = 'active'"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })

})

//create node
router.route("/").post(auth, async (req, res) => {
    const {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status } = req.body
    // try {
    const data = {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status }
    const query = "INSERT INTO nodes VALUES (?, ?, ?, ?, ?, ?, ?);"
    connection.query(query, Object.values(data), (error) => {
        if (error) {
            res.status(400).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json(  data)
            console.log('Node created successfully!', data)
        }
    })
    console.log('Data : ', data)

})

// update node
router.route("/update/:nodeCode").put(auth, async (req, res) => {
    const {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status } = req.body

    // try {
    const data = {nodeCode: nodeCode, companyCode: companyCode, address:address, lat: lat, lng: lng,
        phoneNumber: phoneNumber, status: status }

    const query_exist = "SELECT * FROM nodes WHERE nodeCode = ?"
    connection.query( query_exist,[req.params.nodeCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            const query = `UPDATE nodes SET nodeCode='${nodeCode}', companyCode='${companyCode}', address='${address}', lat='${lat}', lng='${lng}', phoneNumber='${phoneNumber}', status='${status}'WHERE nodeCode = '${req.params.nodeCode}'`
            connection.query(query, (error_update) => {
                if (error_update) {
                    res.status(400).json( {error_update: error_update.message})
                    console.log("error", error_update)
                } else {
                    res.status(200).json( data)
                    console.log('Updated successful!', data)
                }
            })
            console.log('Data : ', data)
        }
    })
})

router.route("/update/status/:nodeCode").patch(auth, async (req, res) => {
    const {nodeCode: nodeCode, status: status } = req.body

    // try {
    const data = {nodeCode: nodeCode, status: status }

    const query_exist = "SELECT * FROM nodes WHERE nodeCode = ?"
    connection.query( query_exist,[req.params.nodeCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            const query = `UPDATE nodes SET status='${status}'WHERE nodeCode = '${req.params.nodeCode}'`
            connection.query(query, (error_update) => {
                if (error_update) {
                    res.status(400).json( {error_update: error_update.message})
                    console.log("error", error_update)
                } else {
                    res.status(200).json( data)
                    console.log('Updated successful!', data)
                }
            })
            console.log('Data : ', data)
        }
    })
})

// delete node by nodeCode
router.route("/:nodeCode").delete(auth, (req, res) => {
    const query = "DELETE FROM nodes WHERE nodeCode = ?"
    connection.query( query,[req.params.nodeCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json({message:`Node ${req.params.nodeCode} is deleted.`})
        }
    })
})

// return node that related to the shipment (currentNode or used to be)
router.route('/related/:shipmentId').get(auth, async (req,res) => {
    const query = "SELECT DISTINCT scannedAt FROM scanData WHERE uid = ?"
    connection.query( query, [req.params.shipmentId], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

// get node by nodeCode
router.route("/:nodeCode").get(auth, (req, res) => {
    const query = "SELECT * FROM nodes WHERE nodeCode = ?"
    connection.query( query,[req.params.nodeCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results[0])
        }
    })
})


// Read nodes of company
router.route("/bycompany/:companyCode").get(auth, (req, res) => {
    const query = "SELECT * FROM nodes WHERE companyCode = ?"
    connection.query( query, [req.params.companyCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

// have stocking shipment that have the same destination
router.route('/stock/samedestination/:destinationNode').get(auth, async (req,res) => {
    const query = "SELECT DISTINCT shipments.currentNode FROM shipments WHERE destinationNode = ? and status != 'shipping' and status != 'completed'"
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
    const query = "SELECT * FROM nodes WHERE companyCode = ? and status = 'active'"
    connection.query( query, [req.params.companyCode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No node found!"});
        } else {
            res.status(200).json(results)
        }
    })
})

module.exports = router;