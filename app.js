var express = require('express');
var app = express();
var ejs = require('ejs');
var mongo = require('mongodb');
var crypto = require('crypto');
var granted = [ ];

app.listen(3500);
app.engine('html', ejs.renderFile);
app.use(session);
app.get('/', (req, res) => res.render('index.html') );
app.get('/register', function(req, res) {
	res.render('register.html');
});
app.post('/register', registerNewUser);
app.get('/list', showAll);
app.get('/login', (req, res) => res.render('login.html'));
app.post('/login', loginUser);
app.get('/profile', showProfile);
app.get('/logout', logoutUser);
app.get('/products', function(req, res) {
	res.render('products.html', {coffee:['Latte', 'Mocha', 'Esp']});
});
app.get('/new',showNewPost);
app.get('/new', (req, res) => res.render('new.html'));
app.use( express.static('public') );
app.use( showError );

function session(req, res, next) {
	var cookie = req.headers["cookie"];
	if (cookie == null) {
		cookie = "";
	}
	var data = cookie.split(";");
	for (var i = 0; i < data.length; i++) {
		var field = data[i].split("=");
		if (field[0] == "session") {
			req.session = field[1];
		}
	}
	if (req.session == null) {
		req.session = parseInt(Math.random() * 1000000) + 
				"-" + parseInt(Math.random() * 1000000) + 
				"-" + parseInt(Math.random() * 1000000) + 
				"-" + parseInt(Math.random() * 1000000);
		res.set("Set-Cookie", "session=" + req.session);
	}
	next();
}

function registerNewUser(req, res) {
	var data = "";
	req.on("data", chunk => data += chunk );
	req.on("end", () => {
		var u = { };
		data = data.replace(/\+/g, ' ');
		var a = data.split('&');
		for (var i = 0; i < a.length; i++) {
			var f = a[i].split('=');
			u[f[0]] = decodeURIComponent(f[1]);
		}
		u.password = crypto.createHmac('sha256', u.password).digest('hex');
		mongo.MongoClient.connect('mongodb://127.0.0.1/start',
			(error, db) => {
				db.collection('user').find({email: u.email}).toArray(
					(error, data) => {
						if (data.length == 0) {
							db.collection('user').insert(u);
							res.redirect("/login");
						} else {
							res.redirect("/register?message=Duplicated Email");
						}
					}
				);
			}
		);
	});
}

function loginUser(req, res) {
	var data = "";
	req.on("data", chunk => data += chunk );
	req.on("end", () => {
		var u = { };
		data = data.replace(/\+/g, ' ');
		var a = data.split('&');
		for (var i = 0; i < a.length; i++) {
			var f = a[i].split('=');
			u[f[0]] = decodeURIComponent(f[1]);
		}
		u.password = crypto.createHmac('sha256', u.password).digest('hex');
		mongo.MongoClient.connect("mongodb://127.0.0.1/start", (error, db) => {
			db.collection("user").find(u).toArray((error, data) => {
				if (data.length == 0) {
					res.redirect("/login?message=Invalid Password");
				} else {
					granted[req.session] = data[0];
					res.redirect("/profile");
				}
			});
		});
	});
}

function showProfile(req, res) {
	if (granted[req.session] == null) {
		res.redirect("/login");
	} else {
		var u = granted[req.session];
		var c = ["Latte", "Mocha", "Espress"];
		res.render("profile.html",
			{user: u, coffee: c });
	}
}

function logoutUser(req, res) {
	delete granted[req.session];
	res.render("logout.html");
}

function showError(req, res, next) {
	res.status(404).render('error.html');
}

function showNewPost(req, res){
    if(granted[req.session] == null){
        res.redirect('/login');
    }else{
        res.render('new.html');
    }
}


function saveNewPost( req, res){
    // req.query.topic
    // req.query.detail
    // granted[req.session]._id
    if(granted[req.session] == null){
        res.redirect('/login')
    }else{
        var data = {};
        data.topic = req.query.topic;
        data.detail = req.query.detail;
        data.owner = granted[req.session]._id;
        monogo.mongoClient.connect('monogodb://127.0.0.1/start', (error,db) => db.collection('post').insert(data));
        res.redirect('/profile');
    }
}

function showAll(req,res){
    mongo.MongoClient.connect("mongodb://127.0.0.1/start", (error,db) => db.collection('post'.find().toArray(
        (error,data) => {
            res.render('lest.html',{post: data});
        }
    )))
}