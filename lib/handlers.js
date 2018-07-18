/**
 * Request handlers
 *
 * Author: Rajen Ghorecha
 * Date: 16th July 2018
 */

// Dependancies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Define all the handlers
var handlers = {};
const acceptableMethods = ['post', 'get', 'put', 'delete'];

// User's handler
handlers.user = function (data, callback) {
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for the user methods
handlers._users = {};

/**
 * User - POST method
 * Create new user and maintain by FS
 * Require fields -- firstname, lastname, phone, password, tocAccept
 * Optional fields : none
 */
handlers._users.post = function (data, callback) {
    var firstname = data.payload.firstname;
    var lastname = data.payload.lastname;
    var phone = data.payload.phone;
    var password = data.payload.password;
    var tocAccept = data.payload.tocAccept;

    firstname = typeof(firstname) == 'string' && firstname.trim().length > 0 ? firstname.trim() : false;
    lastname = typeof(lastname) == 'string' && lastname.trim().length > 0 ? lastname.trim() : false;
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    password = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false;
    tocAccept = typeof(tocAccept) == 'boolean' && tocAccept == true ? true : false;

    if (firstname && lastname && phone && password && tocAccept) {
        // check for user exists or not
        _data.read(config.user, phone, function(err, data) {
            if (err) {
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create a user's object
                    const userObject = {
                        'firstname' : firstname,
                        'lastname' : lastname,
                        'phone' : phone,
                        'hashedPassword' : hashedPassword,
                        'tocAccept' : tocAccept
                    };

                    _data.create(config.user, phone, userObject, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'User can\'t be created!'})
                        }
                    })
                } else {
                    callback(500, {'Error': 'Password Hash can\'t be generated!'})
                }
            } else {
                callback(400, {'Error' : 'This phone number is already exists with a user!'});
            }
        });
    } else {
        callback(500, {'Error': 'Missing required fields!'});
    }
}

// USER - GET
// Required field : Phone
handlers._users.get = function (data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read(config.user, phone, function(err, data) {
            if (!err && data) {
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    } else {
        callback(500, {'Error' : 'Missing Required fields!'});
    }
}

// USER - PUT
// Required field : Phone
handlers._users.put = function (data, callback) {
    var phone = data.payload.phone;
    var firstname = data.payload.firstname;
    var lastname = data.payload.lastname;
    var password = data.payload.password;

    firstname = typeof(firstname) == 'string' && firstname.trim().length > 0 ? firstname.trim() : false;
    lastname = typeof(lastname) == 'string' && lastname.trim().length > 0 ? lastname.trim() : false;
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    password = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false;

    if (phone) {
        if (firstname || lastname || password) {
            _data.read(config.user, phone, function(err, userData) {
                if (!err && data) {
                    if (firstname) {
                        userData.firstname = firstname;
                    }
                    if (lastname) {
                        userData.lastname = lastname;
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }

                    _data.update(config.user, phone, userData, function(err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Can\'t update the user!'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'There is no such user exists!'});
                }
            });
        } else {
            callback(200);
        }
    } else {
        callback(500, {'Error' : 'Missing required parameter'})
    }
}

// USER - Delete
// Required Field : Phone
// Remove the user's data
handlers._users.delete = function (data, callback) {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        _data.read(config.user, phone, function(err, userData) {
            if (!err && userData) {
                _data.remove(config.user, phone, function(err) {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(400, {'Error': 'Unable to remove the user!'});
                    }
                });
            } else {
                callback(400, {'Error' : 'Couldn\'t find the specified user!'});
            }
        })
    } else {
        callback(400, {'Error': 'No Such user found !'});
    }
}

/**
 * Handle the user't tokens
 */

handlers.tokens = function (data, callback) {
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._token[data.method](data, callback);
    } else {
        callback(405);
    }
};

// token methods container
handlers._token = {};

// Token -- POST
// Required data : phone, password
handlers._token.post = function(data, callback) {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // Read user's data.
        _data.read(config.user, phone, function(err, userData) {
            if (!err && userData) {
                var hashedPassword = helpers.hash(password);

                if (userData.hashedPassword == hashedPassword) {
                    
                }
            }
        });
    }
};

// Ping handler
handlers.ping = function(data, callback) {
    callback(200);
};

// Not-Found handler
handlers.notFound = function(data, callback) {
    callback(404);
};

// Export module
module.exports = handlers;
