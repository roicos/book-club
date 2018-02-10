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
		var username = req.body.username ? req.body.username : "";
		var password = req.body.password ? req.body.password : "";

		if(username != ""){
			dbClient.query("select * from users where username = '" + username + "'", (err, result) => {
				if (err){
					handleError("Error to find user in DB: " + err);
				} else if(result.rows.length > 0) {
					var user = result.rows[0];
					bcrypt.compare(password, user.password, function(errBcrypt, resultBcrypt) {
						if(resultBcrypt) {
							req.session.user = user.id;
							req.session.authenticated = true;
							res.status(200).send({"message" : "user authorised: " + user.id, "locals" : {"user" : user.id}, "redirect" : "/"});
						} else {
							res.status(400).send({"message" : "Password is incorrenct."});
						}
					});
				} else {
					res.status(400).send({"message" : "No such username in the database."});
				}
			});
		} else {
			res.status(400).send({"message" : "Username should not be empty."});
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
				res.render("registration", {"message" : "", "states" : result.rows, "data" : {"username" : "", "city" : "", "state" : 0}});
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
						res.status(400).send({"message" : "This username is already exists."});
					} else {
						if(password1 == password2){
							bcrypt.hash(password1, 10, function(err, passHash) {
								dbClient.query("insert into users (username, password, city, stateid) values ('"+ username + "', '"+ passHash + "', '"+ city + "', '"+ state +"') returning *", (errInsert, resultInsert) => {
									if (errInsert){
										handleError("Error to insert new user: " + errInsert);
									} else {
										req.session.user = resultInsert.rows[0]["id"];
										req.session.authenticated = true;
										res.status(200).send({"message" : "user registered successfully: " + resultInsert.rows[0].id, "redirect" : "/", "locals" : {"user" : resultInsert.rows[0].id}});
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

	app.get("/profile", checkAuth, function (req, res, next) {
		var userId = req.session.user;
        dbClient.query("select * from users where id = " + userId, (errUsers, resultUsers) => {
			if (errUsers){
				handleError("Error to get user: " + errUser);
			} else {
				dbClient.query("select * from states", (errStates, resultStates) => {
					if (errStates){
						handleError("Error to get states list: " + errStates);
					} else {
						res.render("registration", {"message" : "", "states" : resultStates.rows, "data" : {"username" : resultUsers.rows[0].username, "city" : resultUsers.rows[0].city, "state" : resultUsers.rows[0].stateid}});
					}
				});
			}
		});
    });

    app.post("/editprofile", function (req, res, next) {
    
		var userid = req.body.userid.trim();
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
					if(resultSelect.rows.length > 1){
						res.status(400).send({"message" : "This username is already exists."});
					} else {
						if(password1 != "******"){
							if(password1 == password2){
								bcrypt.hash(password1, 10, function(err, passHash) {
									dbClient.query("update users set username = '" + username + "', password = '"+ passHash +"', city = '" + city + "', stateid = " + state +" where id = " + userid, (errUpdate, resultUpdate) => {
										if (errUpdate){
											handleError("Error to update user: " + errUpdate);
										} else {
											res.status(200).send({"message" : "profile updated successfully: ", "redirect" : "/profile"});
										}
									});
								});
							} else {
								res.status(400).send({"message" : "Passwords are not the same"});
							}
						} else {
							dbClient.query("update users set username = '" + username + "', city = '" + city + "', stateid = " + state +" where id = " + userid, (errUpdate, resultUpdate) => {
								if (errUpdate){
									handleError("Error to update user: " + errUpdate);
								} else {
									res.status(200).send({"message" : "profile updated successfully: ", "redirect" : "/profile"});
								}
							});
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