require('dotenv').config({path:'../../.env'})
let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const auth = require('../utils/auth')
const admin_auth = require('../utils/admin-auth')
const manager_auth = require('../utils/manager-auth')
const Company = require("../models/company");

// Read companies
router.route("/").get(auth, (req, res) => {
    Company.findAll()
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No company found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })

})

router.route("/:companyCode").get(auth, (req, res) => {
    Company.findOne({ where: {companyCode:req.params.companyCode}})
    .then(result => {
        if ( result ) {
            res.status(200).json(result)
        } else {
            res.status(404).json( {error: "No company found!"});
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
})

// create companies # only admin can create company
router.route("/").post(admin_auth, async (req, res) => {
    const { companyCode: companyCode, companyName: companyName, 
             walletPublicKey: walletPublicKey, walletPrivateKey: walletPrivateKey} = req.body

    // try {
    const data = { companyCode: companyCode, 
        companyName: companyName, 
        walletPublicKey: walletPublicKey, 
        walletPrivateKey: walletPrivateKey}
    const newCompany = new Company (data)
    newCompany.save()
    .then( result => {
        res.status(200).json(  data)
        console.log('Company created successfully!', data)
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });

})

router.route("/:companyCode").delete(admin_auth, (req, res) => {
    Company.destroy({ where: {companyCode:req.params.companyCode}})
    .then( result => {
        res.status(200).json({message:`Company ${req.params.companyCode} is deleted.`})
    } )
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
})

router.route("/update/:companyCode").put(manager_auth, async (req, res) => {
    const { companyCode: companyCode, companyName: companyName, 
        walletPublicKey: walletPublicKey, walletPrivateKey: walletPrivateKey} = req.body

    // try {
    const data = { companyCode: companyCode, 
    companyName: companyName, 
    walletPublicKey: walletPublicKey, 
    walletPrivateKey: walletPrivateKey}

    Company.findOne({ where: { companyCode: req.params.companyCode } })
    .then( result => {
        if ( result ) {
            result.update(data)
            .then( response => {
                res.status(200).json(  data)
                console.log('Company updated successfully!', data)
            })  
        }
        else {
            res.status(404).json( {error: "No company found!"});
        }
        
    })
    .catch((error) => {
    res.status(400).json( {error: error.message})
    console.log("error", error)
    });

})

module.exports = router;