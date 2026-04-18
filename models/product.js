const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    ProductName: String,
    Quantity: Number,
    Price: Number,
    ProductDescription: String,
    Categories:String,
    image: [String]
})

const productsModel = mongoose.model("products",productSchema)
module.exports = productsModel