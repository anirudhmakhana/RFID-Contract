require('dotenv').config({path:'../../.env'})
let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')


const auth = require('../utils/auth')
const admin_auth = require('../utils/admin-auth')
const manager_auth = require('../utils/manager-auth')
const StaffAccount =require("../models/staffAccount")
const Company = require("../models/company")
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

// Read accounts
router.route("/").get(admin_auth, (req, res) => {
    StaffAccount.findAll()
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No staff found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })

})

// Read accounts
router.route("/:username").get((req, res) => {
    StaffAccount.findOne({ where: {username:req.params.username}})
    .then(result => {
        res.status(200).json(result)
    })
    .catch( error => {
        res.status(400).json( {error: error.message})
    })
})

// Get account by company code
router.route("/getByCompany/:companyCode").get(auth, (req, res) => {
    StaffAccount.findAll({where:{companyCode: req.params.companyCode}})
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No staff found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })
})

// delete by username
router.route("/:username").delete(manager_auth, (req, res) => {
    StaffAccount.destroy({ where: {username:req.params.username}})
    .then( result => {
        res.status(200).json({message:`User ${req.params.username} is deleted.`})
    } )
    .catch( error => {
        res.status(400).json( {error: error.message})
    })

})

// register staff account
router.route("/register").post(manager_auth, async (req, res) => {
    const { username: username, password: plainTextPassword, fullName: fullName, email: email, positionLevel: positionLevel, companyCode: companyCode} = req.body

    if (!username || typeof username !== 'string') {
		return res.status(403).json({ error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.status(403).json({ error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.status(403).json({
			error: 'Password should be at least 6 characters'
		})
	}
    StaffAccount.findOne({where:{username:username}})
    .then( res_user => {
        if (res_user) {
            res.status(404).json( {error: "Username used!"});
        } else {
            Company.findOne({where:{companyCode:companyCode}})
            .then( async res_company => {
                if (res_company) {
                    const password = await bcrypt.hash(plainTextPassword, SALT_WORK_FACTOR)

                    // try {
                    const data = {
                        username: username,
                        password: password,
                        fullName: fullName, 
                        email: email, 
                        positionLevel: positionLevel.toLowerCase(),
                        companyCode: companyCode
                    }
                    const newAccount = new StaffAccount(data)
                    newAccount.save()
                    .then( result => {
                        res.status(200).json( data)
                        console.log('Account created successfully!', newAccount)
                    })
                }
                else {
                    res.status(404).json( {error: "Company not found!"});
                }
            })
        }
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });

})

// login as staff user
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
    StaffAccount.findOne({ where: { username:username } })
    .then( async result => {
        console.log(result)
        user = result
        if (!user) {
            return res.status(404).json({  error: 'Staff account not existed' })
        }

        if (await bcrypt.compare(password, user['password'])) {
            // the username, password combination is successful
            var token = jwt.sign(
                {
                    username: username
                },
                process.env.TOKEN_KEY
            )
            if (user.positionLevel == "manager") {
                token = jwt.sign(
                    {
                        username: username,
                    },
                    process.env.MANAGER_TOKEN_KEY
                )
            } 
            var userData = JSON.stringify(user )
            userData = JSON.parse(userData)
            userData.token = token
            return res.status(200).json(userData)
        }
    
        res.status(403).json({ error: 'Invalid password' })
    })
    .catch(error => {
        res.status(400).json( {error: error.message})

    })	
    
})

router.route('/checkPassword').post(auth, async (req,res) => {
    const { username, password } = req.body
    StaffAccount.findOne({where:{username:username}})
    .then(async result => {
        if (result) {
            user = result 
        
            if (await bcrypt.compare(password, user['password'])) {


                return res.status(200).json(user)
            }
        
            res.status(403).json({ error: 'Invalid password' })
        } else {
            res.status(404).json({ error: 'User not existed' })
        }
    })
    .catch( error => {
        res.status(400).json({error: error.message})
    })
})

// update staff
router.route("/update/:username").put(auth, async (req, res) => {
    const {
        username: username,
        password: plainTextPassword,
        fullName: fullName,
        email: email,
        companyCode: companyCode
    } = req.body

    StaffAccount.findOne({where:{username: req.params.username}})
    .then(async result => {
        if ( result ) {
            const password = await bcrypt.hash(plainTextPassword, SALT_WORK_FACTOR)
            const data = {
                username: username,
                password: password,
                fullName: fullName,
                email: email,
                companyCode: companyCode
            }
            result.update(data)
            .then( response => {
                resdata = data
                resdata.positionLevel = result.positionLevel
                res.status(200).json( resdata)
                console.log('Updated successful!', resdata)
            })  
        } else {
            res.status(404).json( {error: "No staff found!"});

        }
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });

})

module.exports = router;