var express = require('express');
var app = express();
var ejs = require('ejs');
var mongo = require('mongodb');
var crypto = require('crypto');
var granted = [ ];

app.listen(3500);
app.engine('html', ejs.renderFile); // การแสดงผล html แบบ EJS
app.use( express.static('public') );
app.use(session);
app.get('/', (req, res) => res.render('index.html') );
app.get('/register', function(req, res) {
	res.render('register.html');
});
app.post('/register', registerNewUser);
app.get('/login', (req, res) => res.render('login.html'));
app.post('/login', loginUser);
app.get('/profile', showProfile);
app.get('/logout', logoutUser);

app.get('/products', products);

app.use(showError);
app.use( express.static('public') );


// install packages: npm install express ejs mongodb
// run:              node app

// mongodb on Windows:
// cd /Users/xxx/Desktop/mongo/bin
// mongod --dbpath . --storageEngine=mmapv1

// mongodb on macOS
// cd /Users/xxx/Dektop/mongo/bin
// ./mongod --dbpath ..use( express.static('public'));


function session(req,res,next){
    var cookie = req.headers['cookie'];
    if (cookie == null){
        cookie = "";
    }
    var  data = cookie.split(';');
    for (var i=0;i < data.length;i++){
        var field = data[i].split('=');
        if(field[0] == 'session'){
            req.session = field[1];
        }
    }
    if(req.session == null){
        req.session = parseInt(Math.random() * 10000000) +
        '-' + parseInt(Math.random() * 1000000) +
        '-' + parseInt(Math.random() * 1000000) +
        '-' + parseInt(Math.random() * 1000000);
        res.set('Set.Cookie','session=' + req.session);
        }
        next();
}


function registerNewUser(req, res){
    var data = "";
    req.on('data', chunk => data += chunk);
    req.on('end', () =>{
        data = decodeURIComponent(data);
        data = data.replace(/\+/g,' ' );//ทำให้เว้นวรรคจาก+ เป็นช่องว่าง
        var a = data.split('&');//แบ่งข้อมูลขั้นด้วย &
        var u = { };
        for(var i=0;i < a.length;i++){
            var f = a[i].split('=');
            u[f[0]] = f[1];
        }


        u.password = crypto.createHmac('sha256',u.password).digest('hex');
        mongo.MongoClient.connect('mongodb://127.0.0.1/start', (error, db) =>{
            db.collection('user').find({email: u.email}).toArray( //ถ้า email ซ้ำกันไม่สามารถเข้าใช้งานได้
                (error, data) => {
                    if(data.length ==0){
                        db.collection('user').insert(u);
                        res.redirect('/login');
                    }
                    else{
                        res.redirect('/register?message=Duplicated Email')
                    }
                }
            )
           // db.collection('user').insert(u);
        })


        //console.log(a);
        //console.log(data);
        //res.redirect('/');
    })
}


function loginUser(req,res){
    req.on('data',chunk => data += chunk);
    req.on('end',() =>{
        //data -> email = mark@facebook.com&password=mark123
        decodeURIComponent(data);
        var a = data.split('&');
        var u = {};
        u.email = data.subString(6,p);
        u.password = data.subString( p + 10, data.length);
        //console.log(u);
        //res.render('index.html')
        
        u.password = crypto.createHmac('sha256',u.password).digest('hex');
        mongo.MongoClient.connect('mongodb://127.0.0.1/start', (error, db) => {
            db.collection("user").find(u).toArray((error, data) => {
				if (data.length == 0) {
					res.redirect("/login?message=Invalid Password");
				} else {
					granted[req.session] = data[0];
                    res.redirect('/profile')
				}
			});
		});
	});
}
    function showProfile(req ,res){
        if(granted[res.session] == null){
            res.redirect('/login')
        }else{
            var u = granted[res.session];
            var c = ["Latte","Mocha", "Espresso"];
            res.redirect('profile.html', {user : u,coffee : c});
        }
    }

function logoutUser(req,res){
    delete granted[req.session];
    res.render('logout.html');
}


function products(req,res){
    res.render('products.html', {coffee:['Latte', 'Mocha', 'Esp']});
}


function showError(req, res , next){
    res.status(404).render('error.html');
    
}