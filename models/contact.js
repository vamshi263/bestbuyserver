const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: {
    type: Date,
    default: Date.now
  }
})

const contactModel = mongoose.model("contacts", contactSchema)

module.exports = contactModel