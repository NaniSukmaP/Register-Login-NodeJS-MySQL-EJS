var path = require('path');
const session = require('express-session');
const express = require('express');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const ejs = require("ejs"); 
const mysql = require('mysql');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({ 
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  }));

var conn = mysql.createConnection({
    host: 'localhost', // assign your host name
    user: 'root',      //  assign your database username
    password: '',      // assign your database password
    database: 'loginTest' // assign database Name
}); 

conn.connect(function(err) {
    if (err) throw err;
    console.log('Database is connected successfully !');
});

app.route('/register')
  .get(function(request, response){
    response.render('registration-form');
  })
  .post(function(req, res, next) {
    var confirm_password= req.body.confirm_password;
    inputData ={
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email_address: req.body.email_address,
        gender: req.body.gender,
        password: req.body.password
    }
    if(confirm_password != inputData.password){
        var msg ="Password & Confirm Password is not Matched";
        res.render('registration-form',{alertMsg:msg});
        }
    // check unique email address
    var sql='SELECT * FROM registration WHERE email_address =?';
    conn.query(sql, [inputData.email_address] ,function (err, data, fields) {
        if(err) throw err
        if(data.length>1){
            var msg = inputData.email_address+ "was already exist";
        }else{   
        // save users data into database
            var sql = 'INSERT INTO registration SET ?';
            conn.query(sql, inputData, function (err, data) {
                if (err) throw err;
                var msg ="Your are successfully registered";
                res.render('registration-form',{alertMsg:msg});
            });
        }    
    }); 
});

app.route('/login')
    .get(function(req, res, next) {
        res.render('login-form');
    })
    .post(function(req, res){
      var emailAddress = req.body.email_address;
      var password = req.body.password;
      var sql='SELECT * FROM registration WHERE email_address =? AND password =?';
      conn.query(sql, [emailAddress, password], function (err, data, fields) {
          if(err) throw err
          if(data.length>0){
              req.session.loggedinUser= true;
              req.session.emailAddress= emailAddress;
              res.redirect('/dashboard');
          }else{
              res.render('login-form',{alertMsg:"Your Email Address or password is wrong"});
          }
      })
  });

 app.get('/dashboard', function(req, res, next) {
    if(req.session.loggedinUser){
        res.render('dashboard',{email:req.session.emailAddress})
    }else{
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(1000, function(){
    console.log('Server is running on port 1000');
});