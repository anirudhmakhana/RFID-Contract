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

// Read accounts
router.route("/").get((req, res) => {
    const query = "SELECT * FROM staffAccounts"
    connection.query( query, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {status: "No staff account found!"});
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

// Read accounts
router.route("/:username").get((req, res) => {
    const query = "SELECT * FROM staffAccounts WHERE username = ?"
    connection.query( query, req.params.username, (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {status: "No staff account found!"});
        } else {
            res.status(200).json(results[0])
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

// Get account by company code
router.route("/getByCompany/:companyCode").get(auth, (req, res) => {
    const query = "SELECT * FROM staffAccounts WHERE companyCode = ?"
    connection.query( query, req.params.companyCode, (error, results) => {
        if (error) {
            console.log(error.message)
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            console.log("no staff")
            res.status(404).json( {status: "No staff account found!"});
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

// delete by username
router.route("/:username").delete(auth, (req, res) => {
    const query = "DELETE FROM staffAccounts WHERE username = ?"
    connection.query( query, req.params.username, (error, results) => {
        if (error) {
            console.log(error.message)
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            console.log("no staff")
            res.status(404).json( {status: "No staff account found!"});
        } else {
            res.status(200).json({message:`Account ${req.params.username} is deleted.`})
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

// register staff account
router.route("/register").post(auth, async (req, res) => {
    const { username: username, password: plainTextPassword, fullName: fullName, contactNumber: contactNumber, companyCode: companyCode} = req.body

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
    const usr = "SELECT * FROM staffAccounts WHERE username = ?"
    connection.query( usr,[username], (error_user, results) => {
        if (results[0]) {
            return res.status(403).json({error:"Username already existed!", res: results})
        } else {
            const comp = "SELECT * FROM companies WHERE companyCode = ?"
            connection.query( comp,[companyCode], async (error_comp, results) => {
                if (error_comp) {
                    return res.status(400).json( {error: error_comp.message})
                }
                else if ( results.length < 1) {
                    return res.status(404).json( {error_comp: "No company found!"});
                } else {
                    const password = await bcrypt.hash(plainTextPassword, SALT_WORK_FACTOR)

                    // try {
                    const data = {
                        username: username,
                        password: password,
                        fullName: fullName, 
                        contactNumber: contactNumber, 
                        companyCode: companyCode
                    }
                    const query = "INSERT INTO staffAccounts VALUES (?, ?, ?, ?, ?);"
                    connection.query(query, Object.values(data), (error) => {
                        if (error) {
                            res.status(400).json( error )
                            console.log("error", error)
                        } else {
                            res.status(201).json( data)
                            console.log('Account created successfully!', data)
                        }
                    })
                    console.log('Data : ', data)

                }
            })
            
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

// login as staff user
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
    const query = "SELECT * FROM staffAccounts WHERE username = ?"
    connection.query( query,[username], async (error, results) => {
        if (error) {
            res.status(error.code).json(error.message)
        }
         else {
            user = results[0]
            
            if (!user) {
                return res.status(404).json({ error: 'User not existed' })
            }
        
            if (await bcrypt.compare(password, user['password'])) {
                // the username, password combination is successful
        
                const token = jwt.sign(
                    {
                        username: username,
                    },
                    process.env.TOKEN_KEY
                )
        
                // return res.json({ status: 'ok', token: token })
                user.token = token

                return res.status(200).json(user)
            }
        
            res.status(403).json({ error: 'Invalid password' })
        }
    })

	
})

module.exports = router;