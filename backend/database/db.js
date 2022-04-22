require('dotenv').config({path:'../.env'})
const { COMPANY_DB_URI} = process.env

module.exports = {
    db: COMPANY_DB_URI
}