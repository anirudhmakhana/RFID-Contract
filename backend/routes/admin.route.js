require('dotenv').config({path:'../../.env'})

let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const AdminAccount = require("../models/adminAccount");

// Read accounts
router.route("/").get((req, res) => {
    AdminAccount.findAll()
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No admin account found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })
})

router.route("/:username").get((req, res) => {
    AdminAccount.findOne({where:{username:req.params.username}})
    .then(results => {
        if ( results.length < 1) {
            res.status(404).json( {error: "No admin account found!"});
        } else {
            res.status(200).json(results)
        }
    })
    .catch( error => {
        res.status(400).json( {error: error.message})

    })
})

// register admin account
router.route("/register").post( async (req, res) => {
    const { username, password: plainTextPassword } = req.body

    if (!username || typeof username !== 'string') {
		return res.status(403).json({ error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.status(403).json({ error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.status(403).json({
			error: 'Password should be atleast 6 characters'
		})
	}
    const password = await bcrypt.hash(plainTextPassword, SALT_WORK_FACTOR)
    AdminAccount.findOne({where:{username:username}})
    .then(response => {
        if (response) {
            res.status(404).json( {error: "Username used!"});

        } else {
            const newAccount = new AdminAccount( {
                username: username,
                password: password
            })
            newAccount.save()
            .then( result => {
                res.status(200).json( {username:username, password:password})
                console.log('Account created successfully!', newAccount)
            })
        }
    })
    .catch((error) => {
        res.status(400).json( {error: error.message})
        console.log("error", error)
    });
    
})

// login as admin
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
    AdminAccount.findOne({ where: { username:username } })
    .then( async result => {
        console.log(result)
        user = result
        if (!user) {
            return res.status(404).json({  error: 'Admin account not existed' })
        }
    
        if (await bcrypt.compare(password, user['password'])) {
            // the username, password combination is successful
    
            const admin_token = jwt.sign(
                {
                    username: username
                },
                process.env.ADMIN_TOKEN_KEY
            )
            var userData = JSON.stringify(user )
            userData = JSON.parse(userData)
            userData.token = admin_token
            return res.status(200).json(userData)
        }
    
        res.status(403).json({ error: 'Invalid password' })
    })
    .catch(error => {
        res.status(400).json( {error: error.message})

    })	
})

module.exports = router;