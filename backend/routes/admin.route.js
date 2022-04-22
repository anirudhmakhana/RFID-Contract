let mongoose = require('mongoose'),
    express = require('express'),
    router = express.Router()
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10

const   createError = require('http-errors');

var ObjectId = require('mongoose').Types.ObjectId; 
let adminAccountSchema = require("../models/AdminAccount")

// Read accounts
router.route("/").get((req, res) => {
    adminAccountSchema.find((error, data) => {
        if (error) {
            return next(error);
        } else {
            res.json(data);
        }
    } )
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

    try {
        const result = await adminAccountSchema.create({
            username,
            password
        })
        console.log('Account created successfully!', result)
    } catch (error) {
        if ( error.code === 11000) {
            return res.json({status:'error', error: "Username already in use."})
        }
        throw error
    }
    res.json({status:200})

})
router.route('/login').post( async (req,res) => {
    const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'User not existed' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		const token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)

		return res.json({ status: 'ok', data: token })
	}

	res.json({ status: 'error', error: 'Invalid password' })
})
