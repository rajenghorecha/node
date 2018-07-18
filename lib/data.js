/**
 *
 * Library to Create data files
 * Author: Rajen Ghorecha
 * Date: 16th July 2018
 */

// Dependancies
fs = require('fs');
path = require('path');
helpers = require('./helpers');

// Container for the data
lib = {};

// Get the base directory path for the DATA STORAGE.
lib.baseDir = path.join(__dirname, '/../.data/');

// Create the method for the create files
lib.create = function(dir, file, data, callback) {
    // Create/Open a new file
    fs.open(lib.baseDir + dir + '\\' + file + '.json', 'wx', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data);

            fs.writeFile(fileDescriptor, stringData, function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('There is an error while closing the file!');
                        }
                    });
                } else {
                    callback('File write operation failed!');
                }
            })
        } else {
            callback('The file can\'t be created! It may already exists.', err);
        }
    });
};

// Read the data from a file
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '\\' + file + '.json', 'utf-8', function(err, data) {
        if (!err && data) {
            const parsedData = helpers.parseJson(data);
            callback(err, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// Update a file data
lib.update = function (dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '\\' + file + '.json', 'r+', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Stringify the data
            const stringData = JSON.stringify(data);

            // Truncate the old data from file.
            fs.truncate(fileDescriptor, function(err) {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            fs.close(fileDescriptor, function(err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error while closing a file!');
                                }
                            });
                        } else {
                            callback('Error while writing a file!');
                        }
                    });
                } else {
                    callback('There is an error while truncating a file!')
                }
            });
        } else {
            callback('The file can\'t be open!');
        }
    });
};

// Delete a file
lib.remove = function (dir, file, callback) {
    // Unlink a file
    fs.unlink(lib.baseDir + dir + '\\' + file + '.json', function(err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error while deleting a file!');
        }
    });
}

// Export the Container
module.exports = lib;
