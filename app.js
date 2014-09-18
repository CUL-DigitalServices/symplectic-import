var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var util = require('util');

var config = require('./config');
var RestAPI = require('./lib/util/rest');

/**
 * Creates a new server
 *
 * @api private
 */
var createServer = function() {

    // Create a new Express application
    var app = express();
    app.use(bodyParser.urlencoded({ 'limit': '250kb', 'extended': true}));
    app.use(bodyParser.json({'limit': '250kb'}));

    // Make the static directories accessible for the HTTP server
    app.use('/js', express.static(__dirname + '/static/js'));
    app.use('/css', express.static(__dirname + '/static/css'));
    app.use('/fonts', express.static(__dirname + '/static/fonts'));

    // Setup the HTTP server
    var httpServer = http.createServer(app).listen(config.app.port, config.app.host);

    // Return an error if spinning up the server failed
    httpServer.once('error', function(err) {
        console.log('Error while spinning up Express server');
        process.exit(0);
    });

    // Invoke the callback when the server is spun up successful
    httpServer.once('listening', function() {
        console.log(util.format('Application now accepting connections at http://%s:%s', config.app.host, config.app.port));

        // Return the basic template for the request
        app.get('/', function(req, res) {
            return res.status(200).sendFile(__dirname + '/static/index.html');
        });

        // API endpoints
        app.get('/api/publications', RestAPI.Symplectic.getPublications);
        app.post('/api/zendesk/ticket', RestAPI.ZenDesk.createZenDeskTicket);
    });
};

createServer();
