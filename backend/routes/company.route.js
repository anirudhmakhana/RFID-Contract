let mongoose = require('mongoose'),
    express = require('express'),
    router = express.Router()
const   createError = require('http-errors');

var ObjectId = require('mongoose').Types.ObjectId; 
let companySchema = require("../models/Company")

router.route('/create-company').post((req, res, next) => {
    companySchema.create(req.body, (error, data) => {
        if (error ) {
            return next(error);
        }
        else {
            console.log(data);
            res.json(data);
        }
    })
})

// Read companies
router.route("/").get((req, res) => {
    companySchema.find((error, data) => {
        if (error) {
            return next(error);
        } else {
            res.json(data);
        }
    } )
})

// Get single company
router.route("/get-company/:id").get((req,res) => {
     companySchema.findById(req.params.id, (error, data) => {
         if (error) {
             return next(error);
         } else {
             res.json(data);
         }
     })
})

// Find company by account
router.route("/get-company-by-account/:acckey").get((req, res) => {
    companySchema.findOne({"staffs.walletAddress":req.params.acckey}, (error, data ) => {
        if (error) {
            return next(error);
        } else {
            console.log(data)
            res.json(data);
        }
    })
})

// Find staff by id
router.route("/get-staff/:staffid").get((req, res) => {
    companySchema.findOne({"staffs._id":new ObjectId(req.params.staffid)}, (error, data ) => {
        if (error) {
            return next(error);
        } else {
            console.log(data)
            var temp;
            data["staffs"].forEach((s) => {
                if (s._id.equals(req.params.staffid)) {
                    temp = s
                }
            })
            console.log('test',temp);
            res.json(temp);
        }
    })
})

// Add staff
router.route("/add-staff/:id").put((req, res, next) => {
    companySchema.findByIdAndUpdate(req.params.id, {
        $push: {
            staffs: req.body
        }
    }, (error, data) => {
        if (error ) {
            console.log(error);
            return next(error);
        } else {
            res.json(data);
            console.log("Staff added successfully")
        }
    })
})

//// Add distribution center
router.route("/add-dist-center/:id").put((req, res, next) => {
    companySchema.findByIdAndUpdate(req.params.id, {
        $push: {
            distCenters: req.body
        }
    }, (error, data) => {
        if (error ) {
            console.log(error);
            return next(error);
        } else {
            res.json(data);
            console.log("Distribution center added successfully")
        }
    })
})

// Update company
router.route('/update-company/:id').put((req, res, next) => {
    companySchema.findByIdAndUpdate(req.params.id, {
        $set: req.body
    }, (error, data) => {
        if (error ) {
            console.log(error);
            return next(error);
        } else {
            res.json(data);
            console.log("Company updated successfully")
        }
    })
})

// Delete company
router.route('/delete-company/:id').delete((req, res, next ) => {
    companySchema.findByIdAndRemove( req.params.id, (error, data) => {
        if (error) {
            return next(error);
        } else {
            res.status(200).json ({
                msg: data
            })
        }
    })
})

// Delete publicKey
router.route('/delete-staff/:id/:staffid').put((req, res, next ) => {
    console.log(typeof req.params.staffid)
    companySchema.findByIdAndUpdate(req.params.id, 
        {$pull: {"staffs":{_id:new ObjectId(req.params.staffid)}}} , (error, data) => {
        if (error) {
            return next(error);
        } else {
            res.status(200).json ({
                msg: data
            })
        }
    })
})

module.exports = router;