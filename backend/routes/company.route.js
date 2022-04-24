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

// Read companies
router.route("/").get(auth, (req, res) => {
    const query = "SELECT * FROM companies"
    connection.query( query, (error, results) => {
        if (error) {
            res.json( {status: "error", reason: error})
        }
        else if ( results.length < 1) {
            res.json( {status: "No company found!"});
        } else {
            res.json(results)
        }
    })
    // adminAccountSchema.find((error, data) => {
    //     if (error) {
    //         return next(error);
    //     } else {
    //         res.json(data);
    //     }
    // } )
})

router.route("/:companycode").get(auth, (req, res) => {
    const query = "SELECT * FROM companies WHERE companyCode = ?"
    connection.query( query,[req.params.companycode], (error, results) => {
        if (error) {
            res.json( {status: "error", reason: error})
        }
        else if ( results.length < 1) {
            res.json( {status: "No company found!"});
        } else {
            res.json(results[0])
        }
    })
})

// create companies # only admin can create company
router.route("/").post(admin_auth, async (req, res) => {
    const { companyCode: companyCode, companyName: companyName, managerContact: managerContact, 
             walletPublicKey: walletPublicKey, walletPrivateKey: walletPrivateKey} = req.body

    // try {
    const data = { companyCode: companyCode, 
        companyName: companyName, 
        managerContact: managerContact, 
        walletPublicKey: walletPublicKey, 
        walletPrivateKey: walletPrivateKey}
    const query = "INSERT INTO companies VALUES (?, ?, ?, ?, ?);"
    connection.query(query, Object.values(data), (error) => {
        if (error) {
            res.json( {status: "error", reason: error.code})
            console.log("error", error)
        } else {
            res.json( {status: 200, data: data})
            console.log('Account created successfully!', data)
        }
    })
    console.log('Data : ', data)

    // } catch (error) {
    //     if ( error.code === 11000) {
    //         return res.json({status:'error', error: "Username already in use."})
    //     }
    //     throw error
    // }
    // res.json({status:200})

})

router.route("/:companycode").delete(admin_auth, (req, res) => {
    const query = "DELETE FROM companies WHERE companyCode = ?"
    connection.query( query,[req.params.companycode], (error, results) => {
        if (error) {
            res.json( {status: "error", reason: error})
        }
        else if ( results.length < 1) {
            res.json( {status: "No company found!"});
        } else {
            res.json({status:200, message:`Company ${req.params.companycode} is deleted.`})
        }
    })
})

module.exports = router;