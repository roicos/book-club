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

	app.get("/", checkAuth, function (req, res, next) {
    		res.render("index");
    });

	app.get("/login", function (req, res, next) {
    	res.render("login", {"errorMessage" : ""});
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
					res.render("login", {"errorMessage" : "Password is incorrect."});
				}
			});
		} else {
			res.render("login", {"errorMessage" : "Login is incorrect."});
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

   	app.get("*", function(req, res){
   		res.status(404).send("Can not find the page");
    });
}
