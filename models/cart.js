const mongoose = require("mongoose")
const cartSchema = new mongoose.Schema({
    userId: {
        type:String,
        required:true
    },
    products:[
        {productId: {
                type:String,
                required:true
            },quantity:{
                type:Number,
                default:1
            }
        }
    ]
})
const cartsModel = mongoose.model("carts", cartSchema)
module.exports = cartsModel