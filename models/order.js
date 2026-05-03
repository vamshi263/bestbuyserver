const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },

      ProductName: String,
      Price: Number,
      category: String,
      quantity: Number,
      image: [String], 
      gst: Number,       
      base: Number,
      total: Number
    }
  ],
  totalAmount: Number,
  address: {
    email: String,
    phone: String,
  },

  paymentMethod: String,
  status: {
    type: String,
    default: "Placed"
  },

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  payment: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String
  },

  date: {
    type: Date,
    default: Date.now
  }
})

const orderModel = mongoose.model("orders", orderSchema)
module.exports = orderModel