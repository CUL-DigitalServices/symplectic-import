#!/usr/bin/env node

var _ = require('underscore');
var q = require('q');
var request = require('request');
var util = require('util');
var xml2js = require('xml2js');

var SymplecticPublication = require('../lib/model').SymplecticPublication;

var URI = 'https://ref.cam.ac.uk:8091/publications-api/v4.6/';
var endpoint = '';

/**
 * Perform a request to the Symplectic API
 *
 * @api private
 */
var doAPIRequest = function() {

    // Send a request to the Symplectic API
    request({'url': util.format('%s%s', URI, endpoint)}, function(err, response) {
        if (err) {
            console.log(err);
        }

        // Parse the response body
        parseXml(response.body)

            // Parse the results
            .then(parseResults)

            .catch(function(err) {
                console.log(err);
            });
    });
};

/**
 * Takes a string and parses it as XML
 *
 * @param  {String}     str     The string to parse
 * @api private
 */
var parseXml = function(str) {
    var deferred = q.defer();

    try {
        var parser = new xml2js.Parser({'explicitArray': true});
        parser.parseString(str, function(err, xml) {
            if (err) {
                return deferred.reject({'code': 500, 'msg': 'Could not parse XML'})
            }
            return deferred.resolve(xml);
        });
    } catch (error) {
        return deferred.reject({'code': 500, 'msg': 'Could not parse XML'})
    }

    return deferred.promise;
};

/**
 * Parses the publications
 *
 * @param  {String}     xml                 Object containing the XML data
 * @api private
 */
var parseResults = function(xml) {

    // Loop the entries
    var entries = _.map(xml.feed.entry, function(entry) {
        return new SymplecticPublication(entry);
    });

    return entries;
};

doAPIRequest();
