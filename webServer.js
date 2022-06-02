/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

var express = require('express');
var app = express();
const fs = require("fs");

// these are the require statements that need to be added for project7
const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var Activities = require("./schema/activities.js");
var SchemaInfo = require('./schema/schemaInfo.js');

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

// adds express-sesssion and body-parser to our express app
app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

// routing behavior
app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

app.get('/test/session', function(request, response) {
    if (request.session.user_id) {
        User.findOne({_id: request.session.user_id}, (e, user) => {
            if (e) response.status(400).send("an error occurred!");
            else {
                if (!user) {
                    response.status(200).send(undefined);
                    return;
                }
                let usr_copy = JSON.parse(JSON.stringify(user));
                delete usr_copy.__v;
                request.session.user_id = user._id;
                response.status(200).send(usr_copy);
            }
        });
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    User.find({}, (e, userList) => {
        if (e) response.status(400).send("An error occurred!");
        else {
            let users = [];
            async.forEach(userList, (user, callback) => {
                let {_id, first_name, last_name} = user;
                users.push({_id, first_name, last_name});
                callback();
            }, err => {
                if (err) console.log("an error occurred getting the user list!");
                else if (users) {
                    response.status(200).send(users);
                }
            });
        }
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You need to be logged in to do that!");
        return;
    }

    const id = request.params.id;
    User.findOne({_id: id}, (e, user) => {
        if (e) response.status(400).send(`User ${id} was not found!`);
        else {
            // only extra parameter according to spec, so delete it
            let usr_copy = JSON.parse(JSON.stringify(user));
            delete usr_copy.__v;
            response.status(200).send(usr_copy);
        }
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You need to be logged in to do that!");
        return;
    }
    
    const id = request.params.id;
    Photo.find({user_id: id}, (e, photos) => {
        if (e) {
            response.status(400).send(`Photos have not been found for user with ID ${id}`);
            return;
        }

        // have to make a copy and loop over to make changes, or else changes won't persist
        let photosCopy = JSON.parse(JSON.stringify(photos));
        async.forEachOf(photosCopy, (photo, i, callback) => {
            // the only "extra" field on the photo objects is __v, according to spec
            delete photo.__v;
            async.forEachOf(photo.comments, (comment, index, callback2) => {
                User.findOne({_id: comment.user_id}, (error, user) => {
                    if (error) response.status(400).send(`User ${user._id} not found!`);
                }).clone().then(user => {
                    photo.comments[index] = {
                        comment: comment.comment,
                        date_time: comment.date_time,
                        _id: comment._id,
                        user: {
                            _id: user._id,
                            first_name: user.first_name,
                            last_name: user.last_name
                        }
                    };
                    callback2();
                });
            }, err => {
                if (err) console.log("An error occurred gathering comments!");
                photosCopy[i] = photo;
                callback();
            });
        }, err => {
            if (err) {
                console.log("An error occurred gathering user photos!");
            } else {
                response.status(200).send(photosCopy);
            }
        });
    });
});

app.get("/mostRecentPhoto/:id", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You need to be logged in to do that!");
        return;
    }
    
    const id = request.params.id;
    Photo.find({user_id: id}, (e, photos) => {
        if (e) {
            response.status(400).send(`Photos have not been found for user with ID ${id}`);
            return;
        }

        // have to make a copy and loop over to make changes, or else changes won't persist
        let photosCopy = JSON.parse(JSON.stringify(photos));
        async.forEachOf(photosCopy, (photo, i, callback) => {
            // the only "extra" field on the photo objects is __v, according to spec
            delete photo.__v;
            async.forEachOf(photo.comments, (comment, index, callback2) => {
                User.findOne({_id: comment.user_id}, (error, user) => {
                    if (error) response.status(400).send(`User ${user._id} not found!`);
                }).clone().then(user => {
                    photo.comments[index] = {
                        comment: comment.comment,
                        date_time: comment.date_time,
                        _id: comment._id,
                        user: {
                            _id: user._id,
                            first_name: user.first_name,
                            last_name: user.last_name
                        }
                    };
                    callback2();
                });
            }, err => {
                if (err) console.log("An error occurred gathering comments!");
                photosCopy[i] = photo;
                callback();
            });
        }, err => {
            if (err) {
                console.log("An error occurred gathering user photos!");
            } else {
                let index = 0;
                for (let i = 1; i < photosCopy.length; i++) {
                    const date1 = Date.parse(photosCopy[index].date_time);
                    const date2 = Date.parse(photosCopy[i].date_time);
                    if (date1 < date2) index = i;   
                }
                response.status(200).send(photosCopy[index]);
            }
        });
    });
});

app.get("/mostCommentedPhoto/:id", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You need to be logged in to do that!");
        return;
    }
    
    const id = request.params.id;
    Photo.find({user_id: id}, (e, photos) => {
        if (e) {
            response.status(400).send(`Photos have not been found for user with ID ${id}`);
            return;
        }

        // have to make a copy and loop over to make changes, or else changes won't persist
        let photosCopy = JSON.parse(JSON.stringify(photos));
        async.forEachOf(photosCopy, (photo, i, callback) => {
            // the only "extra" field on the photo objects is __v, according to spec
            delete photo.__v;
            async.forEachOf(photo.comments, (comment, index, callback2) => {
                User.findOne({_id: comment.user_id}, (error, user) => {
                    if (error) response.status(400).send(`User ${user._id} not found!`);
                }).clone().then(user => {
                    photo.comments[index] = {
                        comment: comment.comment,
                        date_time: comment.date_time,
                        _id: comment._id,
                        user: {
                            _id: user._id,
                            first_name: user.first_name,
                            last_name: user.last_name
                        }
                    };
                    callback2();
                });
            }, err => {
                if (err) console.log("An error occurred gathering comments!");
                photosCopy[i] = photo;
                callback();
            });
        }, err => {
            if (err) {
                console.log("An error occurred gathering user photos!");
            } else {
                let index = 0;
                for (let i = 1; i < photosCopy.length; i++) {
                    const oldLen = photosCopy[index].comments.length;
                    const newLen = photosCopy[i].comments.length;
                    if (newLen > oldLen) index = i;
                }
                response.status(200).send(photosCopy[index]);
            }
        });
    });
});

/* Login and account creation */

/*
 * URL /admin/login - Take data from POST and log in a user.
 */
app.post("/admin/login", function (request, response) {
    const username = request.body.login_name.trim();
    const password = request.body.password;
    User.findOne({login_name: username, password}, (e, user) => {
        if (e) {
            console.log("error");
            response.status(400).send("an error occurred.");
        } else {
            if (!user) {
                response.status(400).send("login failed!");
                return;
            }
            let usr_copy = JSON.parse(JSON.stringify(user));
            delete usr_copy.__v;
            request.session.user_id = user._id;
            request.session.first_name = user.first_name;
            request.session.last_name = user.last_name;
            response.status(200).send(usr_copy);
        }
    });
});

/*
 * URL /admin/logout - Logs the current user out of the app.
 */
app.post("/admin/logout", function (request, response) {
    request.session.destroy(e => {
        if (e) response.status(400).send("an error occurred logging out!");
        else response.status(200).send();
    });
});

/*
 *  URL /user - Creates a new user and returns info to be handled from
 *  account creation screen.
 */
app.post("/user", function (request, response) {
    const {
        login_name, 
        password, 
        first_name, 
        last_name,
        location, 
        description, 
        occupation
    } = request.body;

    User.findOne({login_name}, (e, user) => {
        if (e) {
            console.log(e);
            response.status(400).send("an error occurred");
        } else {
            if (user) {
                response.status(400).send("Username is taken.");
                return;
            }
            User.create({
                first_name, 
                last_name, 
                location, 
                description,
                occupation,
                login_name,
                password
            }, (err, newUser) => {
                if (err) {
                    console.log(err);
                    response.status(400).send(
                        "an error occurred durring registration."
                    );
                } else {
                    response.status(200).send({
                        login_name: newUser.login_name,
                        password: newUser.password
                    });
                }
            });
        }
    });
});

/* Uploading Functionalities */

/*
 *  URL /commentsOfPhoto/:photo_id - Adds a comment to a given photo with 
 *  an _id value of photo_id.
 */
app.post("/commentsOfPhoto/:photo_id", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You must be logged in to do that!");
    } else {
        const {photo_id, comment} = request.body;
        if (comment === "") {
            response.status(400).send("You cannot make an empty comment!");
            return;
        }

        const user_id = request.session.user_id;
        Photo.findOne({_id: photo_id}, (e, photo) => {
            if (e) {
                console.log(e);
                response.status(400).send("An error occurred!");
            } else {
                if (photo.comments === undefined) photo.comments = [];
                photo.comments.push({comment, user_id});
                photo.save();
                response.status(200).send("Comment successful.");
            }
        });

    }
});

app.post("/photos/new", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You need to be logged in to do that!");
    } else {
        processFormBody(request, response, function (err) {
            if (err || !request.file) {
                response.status(400).send("Error occurred uploading file!");
                return;
            }
            // request.file has the following properties of interest
            //      fieldname      - Should be 'uploadedphoto' since that is what we sent
            //      originalname:  - The name of the file the user uploaded
            //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
            //      buffer:        - A node Buffer containing the contents of the file
            //      size:          - The size of the file in bytes
        
            // We need to create the file in the directory "images" under an unique name. We make
            // the original file name unique by adding a unique prefix with a timestamp.
            const timestamp = new Date().valueOf();
            const filename = 'U' +  String(timestamp) + request.file.originalname;
        
            fs.writeFile("./images/" + filename, request.file.buffer, function (error) {
                if (error) {
                    response.status(400).send("Error occurred processing file!");
                    return;
                }
                Photo.create({
                    file_name: filename, 
                    date_time: timestamp,
                    user_id: request.session.user_id,
                    comments: []
                }, (e, createdPhoto) => {
                    if (e) {
                        response.status(400).send("Something went wrong when adding your file.");
                    } else {
                        createdPhoto.save();
                        response.status(200).send("Photo uploaded!");
                    }
                });
            });
        });
    }
});

app.post("/activities/new", function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You must be logged in to do that!");
    }

    let {first_name, last_name, filename, activity, date_time} = request.body;
    if (first_name === "" || last_name === "") {
        first_name = request.session.first_name;
        last_name = request.session.last_name;
    }
    Activities.create({
        first_name, last_name, filename, activity, date_time
    }, (e, createdActivity) => {
        if (e) response.status(400).send("Something went wrong when adding the activity.");
        else {
            createdActivity.save();
            response.status(200).send("Activity Added!");
        }
    });
});

app.get("/activities", function (request, response) {
    if (!request.session.user_id) response.status(401).send("You must be logged in to do that!");
    else {
        Activities.find({}).sort({date_time: "desc"}).limit(5).exec((e, results) => {
            if (e) response.status(400).send("Something went wrong while accessing the activities!");
            else response.status(200).send(results);
        });
    }
});

// app.get("/favorites/:id", function (request, response) {
//     if (!request.session.user_id) response.status(401).send("You must be logged in to do that!")
//     else {
//         User.findOne({_id: request.params.id}, (e, user) => {
//             if (e) {
//                 response.status(400).send("an error occurred!");
//             }
//             else {
//                 if (!user) {
//                     response.status(400).send("no user found!");
//                     return;
//                 }
//                 response.status(200).send(user.favorites);
//             }
//         });
//     }
// });

app.get("/favorites", function (request, response) {
    if (!request.session.user_id) response.status(401).send("You must be logged in to do that!");
    else {
        User.findOne({_id: request.session.user_id}, (e, user) => {
            if (e) {
                response.status(400).send("an error occurred!");
            }
            else {
                if (!user) {
                    response.status(400).send("no user found!");
                    return;
                }
                response.status(200).send(user.favorites);
            }
        });
    }
});

app.post("/favorites/new", function (request, response) {
    if (!request.session.user_id) response.status(401).send("You must be logged in to do that!");
    else {
        let {file_name, photo_date, photo_id} = request.body;
        User.findOne({_id: request.session.user_id}, (e, user) => {
            if (e) {
                response.status(400).send("an error occurred!");
            }
            else {
                if (!user) {
                    response.status(400).send("no user found!");
                    return;
                }
                if (user.favorites === undefined) user.favorites = [];
                let favorite = {file_name, date_time: photo_date, photo_id};
                // console.log(favorite);
                user.favorites.push(favorite);
                user.save();
                response.status(200).send("Favorited successfully");
            }
        });
    }
});

app.post("/favorites/remove", function (request, response) {
    if (!request.session.user_id) response.status(401).send("You must be logged in to do that!");
    else {
        let photo = request.body.photo;
        User.findOne({_id: request.session.user_id}, (e, user) => {
            if (e) response.status(400).send("an error occured!");
            else {
                if (!user) {
                    response.status(400).send("no user found!");
                    return;
                }
                if (user.favorites === undefined) {
                    response.status(400).send("user has no favorites!");
                    return;
                }
                let {file_name} = photo;
                let filteredFavorites = user.favorites.filter(val => {
                    return val.file_name !== file_name;
                });
                user.favorites = filteredFavorites;
                user.save();
                response.status(200).send("Un-Favorited Successfully!");
            }
        });
    }
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});