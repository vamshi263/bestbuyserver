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
const Razorpay = require("razorpay")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use("/uploads", express.static("uploads"))

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected "))
.catch(err => console.log("MongoDB Error", err.message))
app.use(session(
    {
    secret:"secretkey",
    resave:false,
    saveUninitialized:false,
    cookie: {
        secure: false
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

let imageCounter = 0
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/")
    },
    filename: function(req, file, cb){
        imageCounter++
        cb(null, Date.now() + " - " +  file.originalname + imageCounter + " - " + path.extname(file.originalname))
    }
})
const upload = multer({
  storage: storage
})

app.post('/Login',(req,res)=>{
    const{Email,Password} = req.body; 
    userModel.findOne({Email:Email})
    .then(user => {
        if(user){
        if(user.Password === Password ){
            req.session.user = {
                id: user._id,
                role: user.role
            }
            res.json({
                status: "Success",
                role: user.role
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
  const imagePaths = req.files.map(file => file.filename)
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
  console.log(req.body)
  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex")

    console.log(razorpay_signature === expectedSign)

    const isAuthentic = razorpay_signature === expectedSign
    if (isAuthentic) {
     const payment = new Payment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
     }) 
     await payment.save()
     res.json({
      message:"Payment Successfully"
     })
  }
}catch (err) {
    console.log(err)
  }
})

app.post("/order/place", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.json("Please login first")
    }
    const userId = req.session.user.id
    const { email, phone, paymentId } = req.body
    const cart = await cartsModel.findOne({ userId })
    if (!cart || cart.products.length === 0) {
      return res.json("Cart is empty")
    }
    let detailedProducts = []
    for (let item of cart.products) {
      const product = await productsModel.findById(item.productId)
      detailedProducts.push({
        productId: item.productId,
        ProductName: product.ProductName,
        Price: product.Price,
        quantity: item.quantity
      })
    }
    let total = 0
    detailedProducts.forEach(p => total += p.Price * p.quantity)
    const shipping = total * 0.05
    const finalTotal = total + shipping
    const newOrder = new orderModel({
      userId,
      products: detailedProducts,
      totalAmount: parseFloat(finalTotal.toFixed(2)),
      address: {
        email,
        phone
      },
      paymentMethod: "ONLINE",
      paymentStatus: "Completed",
      payment: {
        razorpay_payment_id: paymentId
      },
      status: "Placed"
    })
    await newOrder.save()
    const user = await userModel.findById(userId)
    await sendMail(
      user.Email,
      "Order Placed Successfully",
      `<h3>Order Confirmation</h3>
       <p>Your order has been placed successfully</p>
       <p><b>Total:</b> ₹${finalTotal}</p>
       <p>Status: PLACED</p>`
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
        product.image.forEach((img)=>{
            fs.unlink(`uploads/${img}`, (err)=>{
                if(err){
                    console.log("Error deleting image:", err)
                }
            })
        })
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
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    ProductName: product.ProductName,
                    Price: product.Price,
                    image: product.image
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
        res.status(400).json({message:error.message});
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

