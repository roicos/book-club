const http = require("http");
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set('port', (process.env.PORT || 5000));


// static files
const fs = require("fs");
const path = require("path");

// auth
const bcrypt = require("bcrypt");
const session = require("express-session");
app.use(session(
	{secret: "very-long-and-reliable-secret-word",
         resave: false,
         saveUninitialized: false
    }));


// db
const pg = require("pg");
var dbClient = new pg.Client({
    user: "user",
    password: "secretPassword",
    database: "myDB",
    port: 5432,
    host: "myHost",
    ssl: true
});
dbClient.connect();

// post request parser, sould be before routing
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  	extended: true
}));

// routing
const modulesDir = "./modules"
require(modulesDir + "/routes")(express, app, path, bcrypt, dbClient);


// OTHER MODULES

// START THE APP
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
