const dotenv = require('dotenv');
const express = require('express');
const { check, validationResult } = require("express-validator");
const path = require("path")
const fs = require('fs');
// const morgan = require('morgan');
const bodyParser = require('body-parser')
dotenv.config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2
const app = express();


if (process.env.NODE_ENV === "production") {
    app.use(express.static("build"));
  }

  //connect to DB
mongoose.connect(process.env.dbConnectCloud, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(()=>console.log('Connected to Database'))
  .catch(err=>console.log(err))
  

  //Set uploads folder as static
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'));

// Routing
app.use('/auth', require('./routes/authRoutes'));

// app.get("/",(req,res)=>{
//   res.send("hello")
// })

//handle every other request
app.get('/*', (req, res)=> {
    res.sendFile(path.join(__dirname, 'build/index.html'), (err)=> {
      if (err) {
        res.sendFile(path.join(__dirname, 'build/index.html'))
      }
    })
  })

app.listen(process.env.PORT || 5000, ()=>{ console.log(`Server started on port ${process.env.PORT || 5000}`)})