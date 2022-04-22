const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const coordinate = new Schema ({
    lat : {
        type:Number
    },
    lng : {
        type:Number
    }
})

const staffSchema = new Schema ({
    firstName : {
        type:String
    },
    lastName : {
        type:String
    },
    walletAddress : {
        type:String
    }
})

const distCenterSchema = new Schema ({
    name : {
        type:String
    },
    coordinate : {
        type:coordinate
    }, 
    address : {
        type:String
    },
    zipCode : {
        type:String
    },
    contactNumber : {
        type: String
    }
})

const companySchema = new Schema ( {
    companyName : {
        type: String
    },
    staffs: {
        type: [staffSchema]
    },
    distCenters: {
        type: [distCenterSchema]
    }, 
    managerContact: {     //manager phone number (who has responsibility of)
        type: String
    },
    }
)

 const CompanyModel = mongoose.model('Company', companySchema);

 module.exports = CompanyModel