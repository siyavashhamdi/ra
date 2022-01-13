const express = require('express');
const app = express();
const server = require('http').createServer(app);
const passport = require('passport');
const util = require('util');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const GoogleStrategy = require('./google-oauth2').Strategy;;

const GOOGLE_CLIENT_ID = "871266714567-qihap3chrgelk9ikm8kctpn6jvm62ce3.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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";

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true
},
  function (request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/', function (req, res) {
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user: req.user });
});

app.get('/login', function (req, res) {
  res.render('login', { user: req.user });
});

app.get('/auth/google', passport.authenticate('google', {
  scope: [
    'email', 'profile']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

server.listen(3000, () => {
  console.log("Example app listening at http://localhost:3000")
});
