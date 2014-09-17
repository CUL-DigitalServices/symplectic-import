var express = require('express');
var http = require('http');
var util = require('util');

var API = require('./lib/symplectic/api');

/**
 * Creates a new server
 */
var createServer = function() {

    // Create a new Express application
    var app = express();
    app.use('/css', express.static(__dirname + '/static/css'));
    app.use('/js', express.static(__dirname + '/static/js'));

    // Setup the HTTP server
    http.createServer(app).listen(2000);

    // Return the basic template for the request
    app.get('/', function(req, res) {
        return res.status(200).sendFile(__dirname + '/static/index.html');
    });

    // Return the publications
    app.get('/api/publications', function(req, res) {

        // Request options object
        var opts = {};

        if (req.query.c) {
            if (req.query.c.length !== 10) {
                errors.push('Invalid value for \'created-since\'');
            }
            opts['created-since'] = util.format('%sT00:00:00+01:00', req.query.c);
        }

        if (req.query.e && req.query.e !== 'true') {
            if (req.query.e !== 'false') {
                errors.push('Invalid value for \'ever-approved\'');
            }
            opts['ever-approved'] = false;
        }

        if (req.query.g) {
            opts['groups'] = req.query.g;
        }

        if (req.query.t) {
            opts['content-types'] = req.query.t;
        }

        API.getPublications(opts)

            .then(function(publications) {
                return res.status(200).send(publications);
            })

            .fail(function(err) {
                console.log(err);
                return res.status(400).send(err);
            });
    });
};

createServer();
