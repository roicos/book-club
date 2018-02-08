module.exports = function (express, app, path, bcrypt, dbClient) {

	app.use(express.static(path.join(__dirname, "../public")));

	function checkAuth(req, res, next){
		var permitRequiredUrls = ["/profile", "/mybooks",
		"/addbook", "/deletebook", "requestbook", "/acceptrequest"];
		if (permitRequiredUrls.indexOf(req.url) > -1  && (!req.session || !req.session.authenticated)) {
			res.redirect("/login");
		} else {
			next();
		}
	}

	function handleError(error){
		console.log(error);
        res.status(500).send({"message" : error});
	}

	app.use(function(req, res, next) {
          res.locals.user = req.session.user;
          next();
    });

	app.get("/", checkAuth, function (req, res, next) {
    		res.render("index");
    });

	app.get("/login", function (req, res, next) {
    	res.render("login", {"message" : ""});
   	});

   	app.post("/login", function (req, res, next) {

   		var userName = "User";
   		var hash = "passwordHashByBcrypr";

   		var login = req.body.login ? req.body.login : "";
   		var password = req.body.password ? req.body.password : "";

		if(login === userName){
			bcrypt.compare(password, hash, function(err, result) {
				if(result) {
					req.session.authenticated = true;
					res.redirect("/");
				} else {
					res.render("login", {"message" : "Password is incorrect."});
				}
			});
		} else {
			res.render("login", {"message" : "Login is incorrect."});
		}
    });

    app.get("/logout", function (req, res, next) {
		if (req.session) {
			req.session.destroy(function(err) {
				if(err) {
					return next(err);
				} else {
					return res.redirect("/");
				}
			});
		}
    });

    app.get("/register", function (req, res, next) {
		dbClient.query("select * from states", (err, result) => {
			if (err){
				handleError("Error to get states list: " + err);
			} else {
				res.render("registration", {"message" : "", "status" : false, "states" : result.rows});
			}
		});
    });

    app.post("/register", function (req, res, next) {

		var username = req.body.username.trim();
		var password1 = req.body.password1.trim();
		var password2 = req.body.password2.trim();
		var city = req.body.city.trim();
		var state = req.body.state.trim();

		if(username !="" && city !=""){
			dbClient.query("select id from users where username = '" + username + "'", (errSelect, resultSelect) => {
				if (errSelect){
					handleError("Error to check if user exists: " + errSelect);
				} else {
					if(resultSelect.rows.length > 0){
						res.status(400).send({"message" : "This username is already exists.", "status" : false});
					} else {
						if(password1 == password2){
							bcrypt.hash(password1, 10, function(err, passHash) {
								dbClient.query("insert into users (username, password, city, stateid) values ('"+ username + "', '"+ passHash + "', '"+ city + "', '"+ state +"') returning *", (errInsert, resultInsert) => {
									if (errInsert){
										handleError("Error to insert new user: " + errInsert);
									} else {
										req.session.user = resultInsert.rows[0]["id"];
										req.session.authenticated = true;
										res.status(200).send({"message" : "user registered: " + resultInsert.rows[0].id, "status" : true, "redirect" : "/", "locals" : {"user" : resultInsert.rows[0].id}});
									}
								});
							});
						} else {
							res.status(400).send({"message" : "Passwords are not the same"});
						}
					}
				}
			});
		} else {
			res.status(400).send({"message" : "Username and city should not be empty."});
		}
	});

   	app.get("*", function(req, res){
   		res.status(404).send("Can not find the page");
    });
}