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
    // Get the toke from the headers
    const tokenId = typeof(data.headers.token) == "string" ? data.headers.token : false;
    if (tokenId) {
      handlers._token.verify(tokenId, phone, (isValidToken) => {
        if (isValidToken) {
          _data.read(config.user, phone, function(err, data) {
            if (!err && data) {
              // Remove password hash from the user's object
              delete data.hashedPassword;
              callback(200, data);
            } else {
              callback(404);
            }
          });
        } else {
          callback(403, {'Error': 'Can\'t access the User\'s data, invalid Token !'})
        }
      })
    } else {
      callback(403, {'Error': 'Missing required token for the user'});
    }
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
      const tokenId = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._token.verify(tokenId, phone, (isValidToken) => {
        if (isValidToken) {
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
          callback(403, {'Error': 'Missing required token in header or token is Invalid'});
        }
      })
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
    const tokenId = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._token.verify(tokenId, phone, (isValidToken) => {
      if (isValidToken) {
        _data.read(config.user, phone, function(err, userData) {
          if (!err && userData) {
            _data.remove(config.user, phone, function(err) {
              if (!err) {
                callback(200);
              } else {
                callback(400, {'Error': 'Unable to remove the user!'});
              }
            });
          } else {
            callback(400, {'Error' : 'Couldn\'t find the specified user!'});
          }
        });
      } else {
        callback(403, {'Error': 'Missing a required token or a token is invalid !'});
      }
    });
  } else {
    callback(400, {'Error': 'No Such user found !'});
  }
};

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
handlers._token.post = (data, callback) => {
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Read user's data.
    _data.read(config.user, phone, function(err, userData) {

      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (userData.hashedPassword == hashedPassword) {
          let tokenId = helpers.createRandomString(20);
          let expires = Date.now() + 1000 * 60 * 60;
          let tokenObj = {
            "phone": phone,
            "id": tokenId,
            "expires": expires
          };

          // Store the data.
          _data.create(config.token, tokenId, tokenObj, (err) => {
            if (err) {
              callback(400, {'Error': 'Unable to create a token!'});
            } else {
              callback(200, tokenObj);
            }
          });
        } else {
          callback(404, {'Error': 'Password did not correct !'})
        }
      } else {
        callback(400, {'Error': 'User is not exists'});
      }
    });
  } else {
    callback(404, {'Error': 'Missing required fields!'})
  }
};

// Token - Get
// Require data: Token ID
handlers._token.get = (data, callback) => {
  let ID = typeof(data.queryStringObject.id) === "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
  if (ID) {
    // Check if ID exists
    _data.read(config.token, ID, (err, tokenData) => {
      if (!err) {
        callback(200, tokenData);
      } else {
        callback(400, {'Error': 'Token that you are accessing is not exists!'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Token - PUT
// Required data: Token ID, Extend time(boolean)
handlers._token.put = (data, callback) => {
  let id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id : false;
  let extendTime = typeof(data.payload.extend) == "boolean" && data.payload.extend == true ? true : false;

  if (id && extendTime) {
    // Check if token exist
    _data.read(config.token, id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _data.update(config.token, tokenData.id, tokenData, (err) => {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(400, {'Error': 'Unable to extend the expire time!'});
            }
          });
        } else {
          callback(400, {'Error': 'Can\'t Extend the expire time, Token has been already expired!'})
        }
      } else {
        callback(400, {'Error': 'Invalid Token ID!'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields!'});
  }
};

// Token - Delete
// Required : ID
handlers._token.delete = (data, callback) => {
  id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    _data.read(config.token, id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.remove(config.token, id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Couldn\'t delete specified Token!'});
          }
        });
      } else {
        callback(400, {'Error': 'The token you want to delete is not exists!'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields!'})
  }
};

// Verify Token
handlers._token.verify = (tokenId, phone, callback) => {
  _data.read(config.token, tokenId, (error, tokenData) => {
    if (!error && tokenData) {
      (tokenData.phone === phone && tokenData.expires > Date.now()) ? callback(true) : callback(false);
    } else {
      callback(false);
    }
  })
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
