require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportlocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true  
}));

app.use(session({
  secret: 'A secret string which is not secret',
  resave: false,
  saveUninitialized: false,
  cookie : {}
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB',{
  useNewUrlParser : true,
  useUnifiedTopology : true
})
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String,
  secret : String
});
userSchema.plugin(passportlocalMongoose)
userSchema.plugin(findOrCreate);


const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());

// * serialize for all strategies
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//* serialize deseralize user end


//* google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


app.get("/",  (req, res)=>{

  res.render("home");

});

//* google strategy

app.get('/auth/google',passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  //*

app.get('/secrets',(req,res)=>{
  User.find({'secret' : {$ne:null}},(err,foundUsers)=>{
    if(err) {
      console.log(err);
    }else{
      if(foundUsers){
        res.render('secrets' , {usersWithSecrets : foundUsers})
      }

    }
  })
}) 
app.get("/register",  (req, res)=>{

  res.render("register");

});

//* add new User
app.post('/register',(req,res)=>{

  User.register({username : req.body.username} , req.body.password, (err,newUser)=>{
    if(err){
      console.log(err);
      res.redirect('/register');
    }
    else{
      passport.authenticate('local')(req,res,()=>{
        res.redirect('/secrets');
      })
    }
  })

});

//*login routes
app.get("/login",  (req, res)=>{

  res.render("login");

});

//*Checking is user is authentic
app.post('/login',passport.authenticate('local' , {
  successRedirect:'/secrets',
  failureRedirect : '/login'
}));

app.get('/submit',(req,res)=>{
  if(req.isAuthenticated()) res.render('submit');
  else res.redirect('/login'); 
});

app.post('/submit' , (req,res)=>{
  const newSecret = req.body.secret;
  User.findById(req.user.id, (err,foundUser)=>{
    if(err) {
      console.log(err);
    }else{
      foundUser.secret = newSecret;
      foundUser.save(()=>{
        res.redirect('/secrets')
      });
    }
  })

})


//* logout
app.get('/logout',(req,res)=>{
  req.logout();
  res.redirect('/');
})
app.listen(3000, ()=> {

  console.log("Server started on port 3000");

});

