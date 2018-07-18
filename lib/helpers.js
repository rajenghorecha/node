/**
 * Helpers Library
 *
 * Author: Rajen Ghorecha
 * Date: 16th July 2018
 */

// Dependancies
const config = require('./config');
const crypto = require('crypto');

// Container for the helper object
var helpers = {};

// Create a password Hash
helpers.hash = function(str) {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashKey).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse string to the JSON Data
helpers.parseJson = function(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return e;
    }
}

// Export Module
module.exports = helpers;
