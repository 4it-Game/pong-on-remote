var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// Define our client schema
var AccountSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Account', AccountSchema);