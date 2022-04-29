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

// Read companies
router.route("/").get(auth, (req, res) => {
    const query = "SELECT * FROM companies"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No company found!"});
        } else {
            res.status(200).json(results)
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
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No company found!"});
        } else {
            res.status(200).json(results[0])
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
            res.status(400).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json(  data)
            console.log('Company created successfully!', data)
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
    const staff_query = "DELETE FROM staffAccounts WHERE companyCode = ?"
    connection.query( staff_query, req.params.companyCode, (error, results) => {
        // if (error) {
        //     console.log(error.message)
        //     res.status(400).json( {error: error.message})
        // }
        // else if ( results.length < 1) {
        //     console.log("no staff")
        //     res.status(404).json( {status: "No staff account found!"});
        // } else {
        //     res.status(200).json(results)
        // }
    })
    const query = "DELETE FROM companies WHERE companyCode = ?"
    connection.query( query,[req.params.companycode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No company found!"});
        } else {
            res.status(200).json({message:`Company ${req.params.companycode} is deleted.`})
        }
    })
})

router.route("/update/:companyCode").put(manager_auth, async (req, res) => {
    const { companyCode: companyCode, companyName: companyName, managerContact: managerContact, 
             walletPublicKey: walletPublicKey, walletPrivateKey: walletPrivateKey} = req.body

    // try {
    const data = { companyCode: companyCode, 
        companyName: companyName, 
        managerContact: managerContact, 
        walletPublicKey: walletPublicKey, 
        walletPrivateKey: walletPrivateKey}

    const query_exist = "SELECT * FROM companies WHERE companyCode = ?"
    connection.query( query_exist,[req.params.companycode], (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No company found!"});
        } else {
            const query = `UPDATE companies SET companyCode='${companyCode}', companyName='${companyName}', managerContact='${managerContact}', walletPublicKey='${walletPublicKey}', walletPrivateKey='${walletPrivateKey}' WHERE companyCode = '${req.params.companyCode}'`
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
    

    // } catch (error) {
    //     if ( error.code === 11000) {
    //         return res.json({status:'error', error: "Username already in use."})
    //     }
    //     throw error
    // }
    // res.json({status:200})

})

module.exports = router;