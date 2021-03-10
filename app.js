require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true  
}));

mongoose.connect('mongodb://localhost:27017/userDB',{
  useNewUrlParser : true,
  useUnifiedTopology : true
})

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});
//*encrypt before making model
userSchema.plugin(encrypt, {secret : process.env.SECRET , encryptedFields : ['password']});

const User = mongoose.model('User',userSchema);




app.get("/",  (req, res)=>{

  res.render("home");

});

app.get("/register",  (req, res)=>{

  res.render("register");

});

//* add new User
app.post('/register',(req,res)=>{
  const newUserEmail = req.body.username;
  const newUserPassword = req.body.password;

  const newUser = new User({
    email : newUserEmail,
    password : newUserPassword
  });
  newUser.save((err)=>{
    if(err) console.log(err);
    else res.render('secrets');
  });

})

//*login routes
app.get("/login",  (req, res)=>{

  res.render("login");

});

app.post('/login',(req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
  
  User.findOne({email : username  } , (err,user)=>{
      if(err) console.log(err);
      else {
        if(user)
        if(user.password === password){
          res.render('secrets')
        }
      }
  })
})


app.listen(3000, ()=> {

  console.log("Server started on port 3000");

});

