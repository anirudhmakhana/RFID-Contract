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

// Read accounts
router.route("/").get(admin_auth, (req, res) => {
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

})

// delete by username
router.route("/:username").delete(manager_auth, (req, res) => {
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
                        email: email, 
                        positionLevel: positionLevel.toLowerCase(),
                        companyCode: companyCode
                    }
                    const query = "INSERT INTO staffAccounts VALUES (?, ?, ?, ?, ?, ?);"
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
                if (user.positionLevel == "manager") {
                    const token = jwt.sign(
                        {
                            username: username,
                        },
                        process.env.MANAGER_TOKEN_KEY
                    )
                    user.token = token

                } else {
                    const token = jwt.sign(
                        {
                            username: username,
                        },
                        process.env.TOKEN_KEY
                    )
                    user.token = token

                }

                return res.status(200).json(user)
            }
        
            res.status(403).json({ error: 'Invalid password' })
        }
    })
})

router.route('/checkPassword').post(auth, async (req,res) => {
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


                return res.status(200).json(user)
            }
        
            res.status(403).json({ error: 'Invalid password' })
        }
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

    // try {
    

    const query_exist = "SELECT * FROM staffAccounts WHERE username = ?"
    connection.query( query_exist,[req.params.username],async (error, results) => {
        if (error) {
            res.status(400).json( {error: error.message})
        }
        else if ( results.length < 1) {
            res.status(404).json( {error: "No account found!"});
        } else {
            console.log(results)
            const password = await bcrypt.hash(plainTextPassword, SALT_WORK_FACTOR)
            const data = {
                username: username,
                password: password,
                fullName: fullName,
                email: email,
                companyCode: companyCode
            }
            const query = `UPDATE staffAccounts SET username='${username}', password='${password}', fullName='${fullName}', email='${email}', companyCode='${companyCode}' WHERE username = '${req.params.username}'`
            connection.query(query, (error_update) => {
                if (error_update) {
                    res.status(400).json( {error_update: error_update.message})
                    console.log("error", error_update)
                } else {
                    resdata = data
                    resdata.positionLevel = results[0].positionLevel
                    res.status(200).json( resdata)
                    console.log('Updated successful!', resdata)
                }
            })
            console.log('Data : ', data)
        }
    })

})

module.exports = router;