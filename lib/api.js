var _ = require('underscore');
var colors = require('colors');
var request = require('request');
var q = require('q');
var util = require('util');
var xml2js = require('xml2js');

var Constants = require('./constants').Constants;
var SymplecticPublication = require('../lib/model').SymplecticPublication;

/**
 * Perform a request to the Symplectic API
 *
 * @return {Promise}
 */
var doRequest = module.exports.doRequest = function(url) {
    var deferred = q.defer();

    // Send a request to the Symplectic API
    request({'url': url}, function(err, response) {
        if (err) {
            deferred.reject(err);
        }

        // Parse the response body
        parseXml(response.body)

            // Parse the results
            .then(parseResults)

            // Filter results
            .then(filterResults)
            .then(function(publications) {
                deferred.resolve(publications);
            })

            .catch(function(err) {
                deferred.reject(err);
            });
    });

    return deferred.promise;
};

////////////////
//  INTERNAL  //
////////////////

/**
 * Takes a string and parses it as XML
 *
 * @param  {String}     str     The string to parse
 * @return {Promise}
 * @api private
 */
var parseXml = function(str) {
    var deferred = q.defer();

    try {
        var parser = new xml2js.Parser({'explicitArray': true});
        parser.parseString(str, function(err, xml) {
            if (err) {
                return deferred.reject('Could not parse XML');
            }

            // Check if the Symplectic API threw an error
            if (xml.feed.entry[0]['api:error']) {
                return deferred.reject(xml.feed.entry[0]['api:error'][0]['_']);
            }

            return deferred.resolve(xml);
        });
    } catch (err) {
        return deferred.reject('Could not parse XML');
    }

    return deferred.promise;
};

/**
 * Parses the publications
 *
 * @param  {String}             xml     Object containing the XML data
 * @return {Publication[]}              A collection of Symplectic publications
 * @api private
 */
var parseResults = function(xml) {

    // Loop the entries
    return _.map(xml.feed.entry, function(entry) {
        return new SymplecticPublication(entry);
    });
};

/**
 * Filters the results
 *
 * @param  {Publication[]}      publications    A collection of Symplectic publications
 * @return {Publication[]}                      A collection of published Symplectic publications
 * @api private
 */
var filterResults = function(publications) {

    // Loop the publications and drop the unnecessary ones
    return _.chain(_.map(publications, function(publication) {

        // Only return publications with whitelisted sources
        if (_.indexOf(Constants.sources, publication.source) > -1) {
            return publication;
        }
    })).compact().value();
};
