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

// const pool = mysql.createPool({
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
// })

// Read accounts
router.route("/").get((req, res) => {
    const query = "SELECT * FROM adminAccounts"
    connection.query( query, (error, results) => {
        if (error) {
            res.json( {status: "error", reason: error})
        }
        else if ( results.length < 1) {
            res.json( {status: "No admin account found!"});
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

// register admin account
router.route("/register").post( async (req, res) => {
    const { username, password: plainTextPassword } = req.body

    if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
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

// login as admin
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
    const query = "SELECT * FROM adminAccounts WHERE username = ?"
    connection.query( query,[username], async (error, results) => {
        if (error) {
            res.json( {status: "error", reason: error})
        }
        else if ( results.length < 1) {
            res.json( {status: "No admin account found!"});
        } else {
            user = results[0]
            if (!user) {
                return res.json({ status: 'error', error: 'User not existed' })
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
        
            res.json({ status: 'error', error: 'Invalid password' })
        }
    })

	
})

module.exports = router;