const express = require('express');
const { createServer } = require('http')
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('./google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = "871266714567-qihap3chrgelk9ikm8kctpn6jvm62ce3.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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";

const app = express();
const server = createServer(app);

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

app.set('view engine', 'ejs');
app.use(session({
  secret: 'cookie_secret',
  name: 'kaas',
  proxy: true,
  resave: true,
  saveUninitialized: true
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

app.get('/login', function (req, res) {
  res.render('login', { user: req.user });
});

app.get('/auth/google', passport.authenticate('google', {
  scope: ['email', 'profile']
}));

app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user: req.user });
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

server.listen(3000, () => {
  console.log("Example app listening at http://localhost:3000")
});
