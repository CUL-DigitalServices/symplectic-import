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
 * @param  {String[]}   queryString     A collection of query string parameters
 * @return {Promise}
 */
var getPublications = module.exports.getPublications = function(queryString) {
    var deferred = q.defer();

    // Temporarily store the retrieved publications
    var publications = [];

    /*!
     * Get a page of publications
     *
     * @param  {Number}     page    The page to retrieve
     */
    var _getPublicationsPage = function(page) {

        // Construct the request url
        var _queryString = _.chain(_.clone(queryString)).push(util.format('page=%s', page)).value().sort().join('&');
        var url = util.format('%s?%s', Constants.API.URI, _queryString);

        // Send a request to the Symplectic API
        request({'url': url}, function(err, response, body) {
            if (err) {
                return deferred.reject(err);
            }

            // Parse the response body
            _parseXml(body)

                .then(function(xml) {

                    // Parse the publications
                    var _publications = _.map(xml.feed.entry, function(entry) {
                        return new SymplecticPublication(entry);
                    });

                    // Add a filtered collection of publications to the global publications collection
                    publications = _.union(publications, _filterResults(_publications));

                    // Handle the pagination
                    var pagination = _getPagination(xml);
                    if (pagination.pages === page) {
                        return deferred.resolve(publications);
                    } else {
                        page++;

                        // Symplectic explicitly states that you shouldn't hammer their API with requests and demands that you wait a minimum of half a second between requests
                        setTimeout(_getPublicationsPage, 500, page);
                    }
                })

                .catch(function(err) {
                    return deferred.reject(err);
                });
        });
    };

    // Request the first page
    _getPublicationsPage(1);

    return deferred.promise;
};

////////////////
//  INTERNAL  //
////////////////

/**
 * Filters the results
 *
 * @param  {Publication[]}      publications    A collection of Symplectic publications
 * @return {Publication[]}                      A collection of published Symplectic publications
 * @api private
 */
var _filterResults = function(publications) {

    // Loop the publications and drop the unnecessary ones
    return _.chain(_.map(publications, function(publication) {

        // Only return publications with whitelisted sources
        if (_.indexOf(Constants.sources, publication.source) > -1) {
            return publication;
        }
    })).compact().value();
};

/**
 * Takes the XML object and returns a pagination object
 *
 * @param  {Object} xml The XML object that contains the pagination data
 * @return {Object}     An object containing the keys: `total` which holds the total number of users/publications and `pages` which holds the total number of pages for this request
 * @api private
 */
var _getPagination = function(xml) {
    var nrOfPages = 0;
    var lastPage = _.find(xml.feed['api:pagination'][0]['api:page'], function(page) { return page['$']['position'] === 'last'; });
    if (lastPage) {
        nrOfPages = parseInt(lastPage['$']['number'], 10);
    }

    return {
        'total': xml.feed['api:pagination'][0]['$']['results-count'],
        'pages':  nrOfPages
    };
};

/**
 * Takes a string and parses it as XML
 *
 * @param  {String}     str     The string to parse
 * @return {Promise}
 * @api private
 */
var _parseXml = function(str) {
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
