const express = require ("express")
const mongoose = require ('mongoose')
const cors = require ("cors")
const userModel = require ("./models/users")
const productsModel = require('./models/product')
const cartsModel = require('./models/cart')
const orderModel = require("./models/order")
const multer = require("multer")
const sendMail = require("./models/mailer")
const path = require("path")
const app = express()
const session=require("express-session")
require("dotenv").config()
const fs=require("fs")
const crypto = require("crypto")
const Razorpay = require("razorpay")
const invoiceHTML = require("./models/invoiceHTML")
const generatePDF = require("./models/pdf")
const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const GST_RATES = {
  "TV and Home": 18,
  "Apple": 12,
  "Cell Phones": 5,
  "Headphones": 18,
  default: 18
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

app.use(express.json())
app.use(cors({
    origin: ["https://clone-bestbuy.netlify.app","https://best-buy-app.netlify.app"],
    credentials: true
}))

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected "))
.catch(err => console.log("MongoDB Error", err.message))
app.set("trust proxy", 1)
app.use(session(
    {
    secret:"secretkey",
    resave:false,
    saveUninitialized:false,
    cookie: {
        secure: true,
        sameSite: "none"
    }
    }
))

app.get('/', (req,res)=>{
    productsModel.find({})
    .then(products=> res.json(products))
    .catch(err => res.json(err))
})

app.get("/Admin/getproduct/:id",(req,res) =>{
    productsModel.findById(req.params.id)
    .then(product => res.json (product))
    .catch(err => res.json (err))
})
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
})
const upload = multer({
  storage: storage
})

app.get("/admin/order-status", async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments()
    const pending = await orderModel.countDocuments({ status: "Placed" })
    const shipped = await orderModel.countDocuments({ status: "Shipped" })
    const delivered = await orderModel.countDocuments({ status: "Delivered" })

    res.json({
      totalOrders,
      pending,
      shipped,
      delivered
    })

  } catch (err) {
    console.log(err)
    res.json({})
  }
})

app.post('/login',(req,res)=>{
  console.log("Login route hit", req.body)
    const{Email,Password} = req.body; 
    userModel.findOne({Email:Email})
    .then(user => {
        if(user){
        if(user.Password === Password ){
            req.session.user = {
                id: user._id,
                role: user.role
            }
            req.session.save(() => {
            res.json({
              status: "Success",
              role: user.role
            })
        })
             }else{
                res.json("The password is incorrect")
             }
            }
            else{
                res.json("User does not exist")
            }
        })
    })

app.get("/check-session", (req,res)=>{
    if(req.session.user){
        res.json({ loggedIn: true, user: req.session.user })
    } else {
        res.json({ loggedIn: false })
    }
})
app.get("/logout", (req,res)=>{
    req.session.destroy()
    res.json("Logged out")
})

app.post('/Signup',(req,res)=>
{ 
 userModel.create(req.body)
 .then (users => res.json(users))
 .catch(err=>res.json(err))
})

app.post('/Admin/addproduct', upload.array("image",10), async(req,res)=>
{ 
  try{
    const imagePaths = req.files.map(file => file.path)
  const newProduct = new productsModel({
    ProductName: req.body.ProductName,
    Quantity: req.body.Quantity,
    Price: req.body.Price,
    ProductDescription: req.body.ProductDescription,
    Categories: req.body.Categories,
    image: imagePaths
  })
 await newProduct.save()
 res.json("Product has been added")
 }catch(err){
        console.log(err)
        res.json("Error uploading product")
    }
  })

app.post("/cart/add", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json("Please login first")
    }
    const userId = req.session.user.id
    const { productId } = req.body
    let cart = await cartsModel.findOne({ userId })
    if (!cart) {
      cart = new cartsModel({
        userId,
        products: [{ productId, quantity: 1 }]
      })
      await cart.save()
      return res.json("Product added to Cart")
    }
    const existingProduct = cart.products.find(
      item => item.productId.toString() === productId
    )
    if (existingProduct) {
      existingProduct.quantity += 1
    } else {
      cart.products.push({ productId, quantity: 1 })
    }
    await cart.save()
    res.json(cart)
  } catch (err) {
    console.log(err)
    res.json("Error adding to cart")
  }
})

app.post("/payment/orders", async (req, res) => {
  try {
    const { amount } = req.body
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now()
    }
    const order = await razorpay.orders.create(options)
    res.json(order)
  } catch (err) {
    console.log(err)
    res.status(500).send("Error creating Razorpay order")
  }
})
app.post("/payment/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex")

    const isAuthentic = razorpay_signature === expectedSign

    if (isAuthentic) {
      await orderModel.findOneAndUpdate(
        { "payment.razorpay_order_id": razorpay_order_id },
        {
          "payment.razorpay_payment_id": razorpay_payment_id,
          "payment.razorpay_signature": razorpay_signature,
          paymentStatus: "Completed"
        }
      )

      return res.json({ message: "Payment Successfully" })
    } else {
      return res.status(400).json({
        message: "Payment verification failed"
      })
    }

  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: "Server error"
    })
  }
})

app.post("/order/place", async (req, res) => {
  try {
    console.log("Order Session:", req.session.user) 
    if (!req.session.user) {
      return res.json("Please login first")
    }
    const userId = req.session.user.id
    const { email, phone, paymentId, razorpay_order_id } = req.body
    const cart = await cartsModel.findOne({ userId })
    if (!cart || cart.products.length === 0) {
      return res.json("Cart is empty")
    }
    let detailedProducts = []
    let finalTotal = 0

  for (let item of cart.products) {
  const product = await productsModel.findById(item.productId)

  const price = product.Price
  const qty = item.quantity
  const gstPercent = GST_RATES[product.Categories] || GST_RATES.default

  const total = price * qty
  const base = total / (1 + gstPercent / 100)
  const gstAmount = total - base
  finalTotal += total
    detailedProducts.push({
      productId: item.productId,
      ProductName: product.ProductName,
      Price: price,
      quantity: qty,
      image: product.image, 
      gst: Number(gstAmount.toFixed(2)),
      base: Number(base.toFixed(2)),
      total: Number(total.toFixed(2))
      })
    }
    const finalTotalRounded = parseFloat(finalTotal.toFixed(2))
    const newOrder = new orderModel({
      userId,
      products: detailedProducts,
      totalAmount: finalTotalRounded,
      address: {
        email,
        phone
      },
      paymentMethod: "ONLINE",
      paymentStatus: "Pending",
      payment: {
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: paymentId
      },
      status: "Placed"
    })
    await newOrder.save()
    const user = await userModel.findById(userId)
    let pdfBuffer = null
    try {
      const html = invoiceHTML(newOrder)
      pdfBuffer = await generatePDF(html)
    } catch (err) {
      console.log("PDF failed:", err.message)
    }
    console.log("Reached before mail")
    sendMail(
      user.Email,
      {
        orderId: newOrder._id,
        products: newOrder.products.map(p => ({
          ProductName: p.ProductName,
          quantity: p.quantity,
          Price: p.Price,
          base: p.base,
          gst: p.gst,
          total: p.total
        })),
        totalGST: newOrder.products.reduce((sum, p) => sum + p.gst, 0).toFixed(2),
        totalAmount: newOrder.totalAmount
      },
      pdfBuffer
    )
    await cartsModel.deleteOne({ userId })
    res.json("Order placed successfully")
  } catch (err) {
    console.log(err)
    res.json("Error placing order")
  }
})

app.post("/cart/update", async (req, res) => {
  try {
    const userId = req.session.user.id
    const { productId, action } = req.body
    const cart = await cartsModel.findOne({ userId })
    if (!cart) return res.json("Cart not found")
    const product = cart.products.find(
      item => item.productId.toString() === productId
    )
    if (!product) return res.json("Product not found")
    if (action === "increase") {
      product.quantity += 1
    } else if (action === "decrease") {
      product.quantity -= 1
      if (product.quantity <= 0) {
        cart.products = cart.products.filter(
          item => item.productId.toString() !== productId
        )
      }
    }
    await cart.save()
    res.json(cart)
  } catch (err) {
    console.log(err)
    res.json("Error updating cart")
  }
})

app.post("/cart/remove", async (req, res) => {
  try {
    const userId = req.session.user.id
    const { productId } = req.body
    const cart = await cartsModel.findOne({ userId })
    cart.products = cart.products.filter(
      item => item.productId.toString() !== productId
    )
    await cart.save()
    res.json(cart)
  } catch (err) {
    console.log(err)
    res.json("Error removing item")
  }
})

app.get("/category/:name", async (req, res) => {
  try {
    let category = req.params.name
    category = category.replace(/-/g, " ")
    category = category.split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const products = await productsModel.find({
      Categories: category
    })

    res.json(products)

  } catch (err) {
    console.log(err)
    res.json([])
  }
})

app.get("/manageproduct", (req,res)=>{
    productsModel.find()
    .then(products => res.json(products))
    .catch(err => res.json(err))
})

app.put("/Admin/editproduct/:id", async(req,res) =>{
    await productsModel.findByIdAndUpdate(req.params.id, {
        ProductName:req.body.ProductName, 
        Quantity:req.body.Quantity, 
        Price:req.body.Price, 
        ProductDescription:req.body.ProductDescription})
    .then(product => res.json (product))
    .catch(err => res.json (err))
})

app.put('/Admin/orderstatus/:id',async(req,res)=>{
  try{
    const {status} = req.body
    await orderModel.findByIdAndUpdate(req.params.id,{ status: status })
    const order = await orderModel.findById(req.params.id)
    const user = await userModel.findById(order.userId);
    await sendMail(user.Email, "Order Status Updated",
    `<h3>Order Update</h3>
      <p>Order ID: <b>${order._id}</b></p>
      <p>Status: <b>${order.status}</b></p>`
    )
      res.json("Status Updated")
    }
    catch(err){
      res.json(err)
    }
})

app.delete("/Admin/deleteProduct/:id", async(req,res) =>{
    const id= req.params.id;
        const product = await productsModel.findById({_id:id})
    await productsModel.findByIdAndDelete({_id:id})
    .then(product => res.json (product))
    .catch(err => res.json (err))
})

app.delete("/Admin/deleteOrder/:id", async(req,res) =>{
    const id= req.params.id;
    await orderModel.findByIdAndDelete({_id:id})
    .then(order => res.json (order))
    .catch(err => res.json (err))
})

app.get("/product/:id",async(req,res)=>{
    await productsModel.findById(req.params.id)
    .then(product=>res.json(product))
    .catch(err=>res.json(err))
})

app.get("/cart", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json("Please login first")
        }
        const userId = req.session.user.id
        const cart = await cartsModel.findOne({ userId })
        if (!cart) {
            return res.json([])
        }
        const detailedCart = await Promise.all(
            cart.products.map(async (item) => {
                const product = await productsModel.findById(item.productId)
                const price = product.Price
                const qty = item.quantity
                const gstPercent = GST_RATES[product.Categories] || GST_RATES.default
                const total = price * qty
                const base = total / (1 + gstPercent / 100)
                const gstAmount = total - base
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    ProductName: product.ProductName,
                    Price: product.Price,
                    image: product.image,
                    total: Number(total.toFixed(2)),
                    base: Number(base.toFixed(2)),
                    gst: Number(gstAmount.toFixed(2))
                }
            })
        )
        res.json(detailedCart)
    } catch (err) {
        console.log(err)
        res.json([])
    }
})

app.get("/orders", (req, res) => {
    if (!req.session.user) {
        return res.json("Please login first")
    }
    const userId = req.session.user.id
    orderModel.find({ userId })
    .populate("products.productId")
    .then(orders => res.json(orders))
    .catch(err => res.json(err))
})

app.get("/search", async(req,res) => {
    try{
        const query = req.query.query
        const products = await productsModel.find({
          $or :[{
            ProductName: {
                $regex: query,
                $options: "i"
            }
        },
      {
            Categories: {
                $regex: query,
                $options: "i"
        }},
        {
            ProductDescription: {
                $regex: query,
                $options: "i"
            }
        }]
        })
        res.json(products)
    } catch(err) {
        console.log(err)
    }
})

app.get("/admin/orders", (req,res)=>{
  orderModel.find()
  .populate("products.productId")
  .then(orders=>res.json(orders))
  .catch (err=>res.json(err))
})
const PORT = process.env.PORT || 3001
app.listen(PORT,() =>{
    console.log("Server Running...")
})

