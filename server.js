// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var morgan     = require('morgan')
var jwt        = require('jsonwebtoken'); // used to create, sign, and verify tokens
var nJwt       = require('njwt');
var config     = require('./config'); // get our config file
var User       = require('./app/models/user');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use morgan to log requests to the console
app.use(morgan('dev'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
// on routes that end in /users
// ----------------------------------------------------


    router.get('/setup', function(req, res) {

      // create a sample user
      var testUser = new User({
        name: 'Svende',
        password: 'password',
        admin: false
      });

      // save the sample user
      testUser.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
      });
    });

    router.post('/authenticate', function(req, res) {

        // find the user
        User.findOne({
          name: req.body.name
        }, function(err, user) {

          if (err) throw err;

          if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
          } else if (user) {
            // check if password matches
            if (user.password != req.body.password) {
              res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {
              var claims = {
                sub: user.id,
                iss: config.iss, //Fix this!
                permissions: user.admin ? 'admin' : 'user'
              }
              // if user is found and password is right
              // create a token
              var jwt = nJwt.create(claims, app.get('superSecret'));
              var token = jwt.compact();
              console.log(jwt);

              // return the information including token as JSON
              res.json({
                success: true,
                message: 'Enjoy your token!',
                token: token
              });
            }

          }

        });
      });
    // route middleware to verify a token
    router.use(function(req, res, next) {

      // check header or url parameters or post parameters for token
      var token = req.body.token || req.query.token || req.headers['x-access-token'];

      // decode token
      if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
          if (err) {
            return res.json({ success: false, message: 'Failed to authenticate token.' });
          } else {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;
            next();
          }
        });

      } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

      }
    });

    // REGISTER OUR ROUTES -------------------------------
    // all of our routes will be prefixed with /api
    app.use('/api', router);

      router.route('/users')

          // create a user (accessed at POST http://localhost:8080/api/users)
          .post(function(req, res) {

              var user = new User();      // create a new instance of the User model
              user.name = req.body.name;  // set the users name (comes from the request)
              console.log('Something is happening.');
              // save the bear and check for errors
              user.save(function(err) {
                  if (err) {
                    res.send(err);
                    console.log(err);
                  }
                  console.log('User created');
                  res.json({ message: 'User created!' });
              });

          })
          .get(function(req, res) {
              User.find(function(err, users) {
                  if (err) {
                      res.send(err);
                      console.log(err);
                  }
                  console.log(users);
                  res.json(users);
              });
          });

          // on routes that end in /bears/:bear_id
          // ----------------------------------------------------
          router.route('/users/:user_id')

              // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
              .get(function(req, res) {
                  User.findById(req.params.user_id, function(err, user) {
                      if (err)
                          res.json({ message: 'No user with that id!' });
                      res.json(user);
                  });
              })

              .put(function(req, res) {
              // use our user model to find the user we want
              User.findById(req.params.user_id, function(err, user) {

                  if (err)
                      res.send(err);

                  user.name = req.body.name;  // update the user info

                  // save the user
                  user.save(function(err) {
                      if (err)
                          res.send(err);

                      res.json({ message: 'User updated!' });
                  });

              });
          });

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
