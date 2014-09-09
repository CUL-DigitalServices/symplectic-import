var _ = require('underscore');
var colors = require('colors');
var request = require('request');
var q = require('q');
var util = require('util');
var xml2js = require('xml2js');

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
 * @param  {String}             xml     Object containing the XML data
 * @return {Publication[]}              A collection of Symplectic publications
 * @api private
 */
var parseResults = function(xml) {

    // Loop the entries
    var publications = _.map(xml.feed.entry, function(entry) {
        return new SymplecticPublication(entry);
    });

    return publications;
};

/**
 * Filters the results
 *
 * @param  {Publication[]}      publications    A collection of Symplectic publications
 * @return {Publication[]}                      A collection of published Symplectic publications
 * @api private
 */
var filterResults = function(publications) {
    return _.chain(_.map(publications, function(publication) {
        if (publication.publicationStatus === 'Published') {
            return publication;
        }
    })).compact().value();
};
