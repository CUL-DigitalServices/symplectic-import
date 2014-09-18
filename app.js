var bodyParser = require('body-parser');
var express = require('express');
var http = require('http');

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
    http.createServer(app).listen(config.app.port, config.app.host);

    // Return the basic template for the request
    app.get('/', function(req, res) {
        return res.status(200).sendFile(__dirname + '/static/index.html');
    });

    // API endpoints
    app.get('/api/publications', RestAPI.Symplectic.getPublications);
    app.post('/api/zendesk/ticket', RestAPI.ZenDesk.createZenDeskTicket);
};

createServer();
