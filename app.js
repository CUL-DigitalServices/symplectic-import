var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');
var socketIO = require('socket.io');
var timeout = require('connect-timeout');
var util = require('util');

var APP = module.exports.APP = require('./lib/modules');
var config = require('./config');

var httpServer = null;
var socketServer = null;

/**
 * Creates a new server
 *
 * @api private
 */
var createHTTPServer = function() {

    // Create a new Express application
    var app = express();

    // Setup the HTTP server
    httpServer = http.createServer(app).listen(config.app.port);

    // Return an error if spinning up the server failed
    httpServer.once('error', function(err) {
        console.log('Error while spinning up Express server');
        process.exit(0);
    });

    // Invoke the callback when the server is spun up successful
    httpServer.once('listening', function() {
        console.log(util.format('Application now accepting connections at http://%s:%s', config.app.host, config.app.port));

        app.use(bodyParser.urlencoded({ 'limit': '250kb', 'extended': true}));
        app.use(bodyParser.json({'limit': '250kb'}));

        // Make the static directories accessible for the HTTP server
        app.use(express.static(__dirname + '/static'));

        // Return the basic template for the request
        app.get('/', function(req, res) {
            return res.status(200).sendFile(__dirname + '/static/index.html');
        });

        // API endpoints
        app.post('/api/zendesk/ticket', APP.Util.REST.ZenDesk.createZenDeskTicket);
    });
};

/**
 * Creates a socket server
 *
 * @api private
 */
var createSocketServer = function() {

    // Setup a socket server
    socketServer = socketIO.listen(httpServer);

    // Start polling for connections
    socketServer.on('connection', function(socketConnection) {

        // Request the publications
        socketConnection.on('PUB_GET_PUBLICATIONS', function(opts) {

            APP.Search.getPublications(opts)

                .then(function(publications) {
                    socketConnection.emit('PUB_GET_PUBLICATIONS', publications);
                })

                .progress(function(progress) {
                    socketConnection.emit('PUB_GET_PUBLICATIONS_PROGRESS', progress);
                })

                .fail(function(err) {
                    socketConnection.emit('PUB_ERROR', {'err': err});
                });
        });
    });
};

/**
 * Initiaize the application
 */
var init = function() {

    // Create a HTTP server
    createHTTPServer();

    // Create a socket server
    createSocketServer();
};

init();

