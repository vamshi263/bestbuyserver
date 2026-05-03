const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    Name: String,
    Email: String,
    Password: String,
    Phone: String,
    role:{
        type: String,
        default:"user"
    }
})

const usersModel = mongoose.model("users",userSchema)
module.exports = usersModel