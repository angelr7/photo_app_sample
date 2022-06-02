"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create a schema
var activitySchema = new mongoose.Schema({
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    filename: String,  // Relevant filename (for comments and uploads)
    activity: String,  // The activity that was performed
    date_time: {type: Date, default: Date.now} // The time of the activity
});

// the schema is useless so far
// we need to create a model using it
var Activities = mongoose.model('Activities', activitySchema);

// make this available to our users in our Node applications
module.exports = Activities;
