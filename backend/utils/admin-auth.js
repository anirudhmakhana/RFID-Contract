require('dotenv').config({path:'../../.env'})
const jwt = require('jsonwebtoken')


const verifyAdminToken = (req, res, next ) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"]

    if (!token) {
        return res.status(403).send("A admin authentification token is required!")
    }

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_TOKEN_KEY)
        req.user = decoded
    } catch( err ) {
        return res.status(401).send("Invalid token!")
    }
    return next()
}

module.exports = verifyAdminToken