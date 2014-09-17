var _ = require('underscore');
var q = require('q');
var ZenDesk = require('node-zendesk');

var config = require('../../config');

var Constants = require('./constants').Constants;
var ZenDeskTicket = require('./model').ZenDeskTicket;

var client = null;

/**
 * Creates a ZenDesk ticket for each publication
 *
 * @param  {Publication[]}  publications    A collection of publications
 */
var createZenDeskTickets = module.exports.createZenDeskTickets = function(publications) {
    var deferred = q.defer();

    if (!client) {
        _createZenDeskClient();
    }

    if (!_.isArray(publications)) {
        publications = [ publications ];
    }

    /*!
     * Creates a ZenDesk ticket for a specific publication
     */
    var _createZenDeskTicket = function() {
        if (!publications.length) {
            return deferred.resolve();
        }

        var publication = publications.shift();

        var subject = 'The ticket subject';
        var comment = 'The ticket comments';
        var custom_fields = [
            {'id': Constants.fields.ACCEPTANCE_DATE, 'value': '2014-09-18'},
            {'id': Constants.fields.AUTHOR_COMMENTS, 'value': 'The comments'},
            {'id': Constants.fields.CAMBRIDGE_ADDENDUM, 'value': true},
            {'id': Constants.fields.DEPARTMENT, 'value': 'the custom department'},
            {'id': Constants.fields.FUNDERS, 'value': 'Funder A, Funder B, Funder C'},
            {'id': Constants.fields.PUBLISHER, 'value': 'the custom publisher'}
        ];

        var data = new ZenDeskTicket(subject, comment, custom_fields);

        // Send a request to the ZenDesk API
        client.tickets.create(data, function(err, req, res) {
            if (err) {
                console.log(err);
                return deferred.reject('Error while creating ZenDesk ticket');
            }

            // Continue the loop
            return _createZenDeskTicket();
        });
    };

    _createZenDeskTicket();

    return deferred.promise;
};

////////////////
//  INTERNAL  //
////////////////

/**
 * Creates a new ZenDesk client
 *
 * @api private
 */
var _createZenDeskClient = function() {
    client = ZenDesk.createClient({
        'username': config.zendesk.username,
        'token': config.zendesk.token,
        'remoteUri': config.zendesk.uri
    });
};
