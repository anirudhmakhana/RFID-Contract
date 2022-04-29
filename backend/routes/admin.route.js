require('dotenv').config({path:'../../.env'})

let express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10
    jwt = require('jsonwebtoken')

const createError = require('http-errors');
const mysql = require('mysql')

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


// Read accounts
router.route("/").get((req, res) => {
    const query = "SELECT * FROM adminAccounts"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No admin account found!"});
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

    // try {
    const data = {
        username: username,
        password: password
    }
    const query = "INSERT INTO adminAccounts VALUES (?, ?);"
    connection.query(query, Object.values(data), (error) => {
        if (error) {
            res.status(400).json( {error: error.message})
            console.log("error", error)
        } else {
            res.status(200).json( data)
            console.log('Account created successfully!', data)
        }
    })
    console.log('Data : ', data)
})

// login as admin
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
    const query = "SELECT * FROM adminAccounts WHERE username = ?"
    connection.query( query,[username], async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else {
            user = results[0]
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
                user.token = admin_token

                return res.status(200).json(user)
            }
        
            res.status(403).json({ error: 'Invalid password' })
        }
    })

	
})

module.exports = router;