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

// get all scanData
router.route("/").get(auth, (req, res) => {
    const query = "SELECT * FROM scanData"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No scan data found!"});
        } else {
            res.status(200).json(results)
        }
    })

})

// create scan data
router.route("/").post(auth, async (req,res) => {
    
    const data = [req.body.uid, req.body.currentNode, req.body.scannedTime,
        req.body.status , req.body.transactionHash]
    const query = "INSERT INTO scanData VALUES (?, ?, ?, ?, ?);"
    connection.query(query, data, (error) => {
        if (error) {
            res.status(403).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json(  data)
            console.log('Scan data uploaded successfully!', data)
        }
    })
            
    
    
})

module.exports = router;