"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

var favoriteSchema = new mongoose.Schema({
    file_name: String, 
    date_time: Date,
    photo_id: mongoose.Schema.Types.ObjectId
});

// create a schema
var userSchema = new mongoose.Schema({
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    location: String,  // Location  of the user.
    description: String,  // A brief user description
    occupation: String,  // Occupation of the user.
    login_name: String,  // Username.
    password: String,  // Password.
    favorites: [favoriteSchema] // A list of favorites
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
