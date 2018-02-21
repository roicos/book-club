module.exports = function (express, app, path, bcrypt, dbClient) {

	app.use(express.static(path.join(__dirname, "../public")));

	function checkAuth(req, res, next){
		var permitRequiredUrls = ["/profile", "/books",
		"/addbook", "/deletebook", "requestbook", "/acceptrequest"];
		if (permitRequiredUrls.indexOf(req.url) > -1  && (!req.session || !req.session.authenticated)) {
			res.redirect("/login");
		} else {
			next();
		}
	}

	function handleError(error, res){
		console.log(error);
        res.status(500).send({"message" : error});
	}

	app.use(function(req, res, next) {
          res.locals.user = req.session.user;
          next();
    });

	app.get("/", checkAuth, function (req, res, next) {
			dbClient.query("select *, ub.id as ubid from books join usertobook as ub on (books.id = ub.bookId) join users on (ub.userId = users.id) join states on (users.stateId = states.id) order by books.id desc", (err, result) => {
				if (err){
					handleError("Error to get books list: " + err, res);
				} else {
					var data = [];
					var currentBookId = 0;
					for(var i=0; i<result.rows.length; i++){
						if(currentBookId != result.rows[i].bookid){
							data.push({
								"title" : result.rows[i].title,
								"authors" : result.rows[i].authors,
								"isbn" : result.rows[i].isbn,
								"picture" : result.rows[i].picture,
								"users" : []
							});

							data[data.length-1].users.push({
								"username" : result.rows[i].username,
								"city" : result.rows[i].city,
								"state": result.rows[i].name,
								"usertobookId" : result.rows[i].ubid
							});
							currentBookId = result.rows[i].bookid;
						} else {
							data[data.length-1].users.push({
								"username" : result.rows[i].username,
								"city" : result.rows[i].city,
								"state": result.rows[i].name,
								"usertobookId" : result.rows[i].ubid
							});
						}
					}
					res.render("index", {"books" : data});
				}
			});
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
					handleError("Error to find user in DB: " + err, res);
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
				handleError("Error to get states list: " + err, res);
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
					handleError("Error to check if user exists: " + errSelect, res);
				} else {
					if(resultSelect.rows.length > 0){
						res.status(400).send({"message" : "This username is already exists."});
					} else {
						if(password1 == password2){
							bcrypt.hash(password1, 10, function(err, passHash) {
								dbClient.query("insert into users (username, password, city, stateid) values ('"+ username + "', '"+ passHash + "', '"+ city + "', '"+ state +"') returning *", (errInsert, resultInsert) => {
									if (errInsert){
										handleError("Error to insert new user: " + errInsert, res);
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
				handleError("Error to get user: " + errUser, res);
			} else {
				dbClient.query("select * from states", (errStates, resultStates) => {
					if (errStates){
						handleError("Error to get states list: " + errStates, res);
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
					handleError("Error to check if user exists: " + errSelect, res);
				} else {
					if(resultSelect.rows.length > 1){
						res.status(400).send({"message" : "This username is already exists."});
					} else {
						if(password1 != "******"){
							if(password1 == password2){
								bcrypt.hash(password1, 10, function(err, passHash) {
									dbClient.query("update users set username = '" + username + "', password = '"+ passHash +"', city = '" + city + "', stateid = " + state +" where id = " + userid, (errUpdate, resultUpdate) => {
										if (errUpdate){
											handleError("Error to update user: " + errUpdate, res);
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
									handleError("Error to update user: " + errUpdate, res);
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

	app.get("/books", checkAuth, function (req, res, next) {
		var userId = req.session.user;
		var query = "select *, ub.id as ubid from usertobook as ub join books as b on (ub.bookId = b.id) where ub.userId = " + userId;
		dbClient.query(query, (err, result) => {
			if (err){
				handleError("Error to get user books: " + err, res);
			} else {
			console.log(result.rows);
				res.render("books", {"books" : result.rows, "message" : ""});
			}
		});
	});

	app.post("/addbook", checkAuth, function (req, res, next) {
		var userId = req.session.user;
		var isbn = req.body.isbn.trim();
		dbClient.query("select * from books where isbn = '" + isbn + "'", (errSelectBook, resultSelectBook) => {
			if (errSelectBook){
				handleError("Error to get book from db: " + errSelectBook, res);
			} else {
				if(resultSelectBook.rows.length > 0){ // book is already in db
					dbClient.query("insert into usertobook (userId, bookId) values (" + userId + ", " + resultSelectBook.rows[0].id+ ") returning id", (errAddUserToBook, resultAddUserToBook) => {
						if (errAddUserToBook){
							handleError("Error to add user to book: " + errAddUserToBook, res);
						} else {
							res.status(200).send({"message" : "You succesfully added book: " + resultSelectBook.rows[0].title, "redirect" : "books"});
						}
					});
				} else { // if not - look in google and add to db
					var books = require('google-books-search');
                    books.search('isbn:'+isbn, function(errorBookSearch, resultsBookSearch) {
						if (errorBookSearch ) {
							handleError("Error book search: " + errorBookSearch, res);
						} else {
							if(resultsBookSearch.length > 0){
								var title = resultsBookSearch[0].title;
								var authors = resultsBookSearch[0].authors != undefined ? resultsBookSearch[0].authors.join(", ") : "";
								var picture = resultsBookSearch[0].thumbnail;
								dbClient.query("insert into books (isbn, picture, title, authors) values ('" + isbn + "', '" + picture + "', '" + title + "', '" + authors + "') returning id", (errorInsertBook, resultInsertBook) => {
									if(errorInsertBook){
										handleError("Error insert book: " + errorInsertBook, res);
									} else {
										dbClient.query("insert into usertobook (userId, bookId) values (" + userId + ", " + resultInsertBook.rows[0].id+ ")", (errAddUserToBook, resultAddUserToBook) => {
											if (errAddUserToBook){
												handleError("Error to add user to book: " + errAddUserToBook, res);
											} else {
												res.status(200).send({"message" : "You succesfully added book: " + title, "redirect" : "books"});
											}
										});
									}
								});
							} else {
								res.status(400).send({"message" : "No book was found with such ISBN."});
							}
						}
					});
				}
			}
		});
	});

	app.post("/deletebook", checkAuth, function (req, res, next) {
		var userId = req.session.user;
		var id = req.body.id.trim();

		// TODO: check if there are no requests

		dbClient.query("select count(*) from requests where usertobook = " + id, (errCountRequests, resultCountRequests) => {
			if (errCountRequests){
				handleError("Error to count requests: " + errCountRequests, res);
			} else {
				if(resultCountRequests.rows[0].count == 0){
					dbClient.query("delete from usertobook where id = " + id + " returning bookid", (errDelete, resultDelete) => {
						if (errDelete){
							handleError("Error to delete book: " + errDelete, res);
						} else {
							var bookId = resultDelete.rows[0].bookid;
							dbClient.query("select count(*) from usertobook where bookId = " + bookId + "", (errSelect, resultSelect) => {
								if (errSelect){
									handleError("Error to find book: " + errSelect, res);
								} else {
									if(resultSelect.rows[0].count == 0){
										dbClient.query("delete from books where id = " + bookId, (errDeleteBook, resultDeleteBook) => {
											if (errDeleteBook){
												handleError("Error to delete book: " + errDeleteBook, res);
											} else {
												res.status(200).send({"message" : "book deleted", "redirect" : "/books"})
											}
										});
									}
								}
							});
						}
					});
				} else {
					res.status(400).send({"message" : "There are requests for this book. book can not be deleted"});
				}
			}
		});
	});

   	app.get("*", function(req, res){
   		res.status(404).send("Can not find the page");
    });
}