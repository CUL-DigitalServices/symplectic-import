var _ = require('underscore');
var colors = require('colors');
var request = require('request');
var q = require('q');
var qs = require('querystring');
var util = require('util');
var xml2js = require('xml2js');

var Constants = require('./constants').Constants;
var SymplecticPublication = require('../lib/model').SymplecticPublication;

/**
 * Perform a request to the Symplectic API
 *
 * * deferred.reject    {String}            Error message
 * * deferred.notify    {Number}            The relational percentage of each loop
 * * deferred.resolve   {Publication[]}     A collection of publications
 *
 * @param  {Object}     opts     Object containing request parameters
 * @return {Promise}
 */
var getPublications = module.exports.getPublications = function(opts) {
    var deferred = q.defer();

    // Remove the content-type from the options since this is an internal parameter
    var contentTypes = [];
    if (opts['content-types']) {
        contentTypes = opts['content-types'].split(',');
        delete opts['content-types'];
    }

    // Temporarily store the retrieved publications
    var publications = [];

    /*!
     * Get a page of publications
     *
     * @param  {Number}     page    The page to retrieve
     */
    var _getPublicationsPage = function(page) {
        var _opts = _.clone(opts);

        // Add the page to the request options
        _opts['page'] = page;

        // Construct the request url
        var url = util.format('%s?%s', Constants.API.URI, qs.encode(_opts));

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
                    publications = _.union(publications, _filterResults(contentTypes, _publications));

                    // Fetch the pagination object
                    var pagination = _getPagination(xml);

                    // Notify the progress handler
                    deferred.notify(100 / pagination.pages);

                    // Handle the pagination
                    if (pagination.pages === page) {
                        return deferred.resolve(publications);
                    } else {
                        page++;

                        // Symplectic explicitly states that you shouldn't hammer their API with requests and demands that you wait a minimum of half a second between requests
                        setTimeout(_getPublicationsPage, 500, page);
                    }
                })

                .fail(function(err) {
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
 * @param  {String[]}           contentTypes    A collection of content types
 * @param  {Publication[]}      publications    A collection of Symplectic publications
 * @return {Publication[]}                      A collection of published Symplectic publications
 * @api private
 */
var _filterResults = function(contentTypes, publications) {

    // Loop the publications and drop the unnecessary ones
    return _.chain(_.map(publications, function(publication) {

        // Only return publications with whitelisted sources
        if (_.indexOf(Constants.sources, publication.source) > -1) {

            // Only return publications with specified publication types
            if ((contentTypes.length && _.indexOf(contentTypes, publication.publicationType) > -1) || !contentTypes.length) {
                return publication;
            }
        }
    })).compact().value();
};

/**
 * Takes the XML object and returns a pagination object
 *
 * @param  {Object}     xml     The XML object that contains the pagination data
 * @return {Object}             An object containing the keys: `total` which holds the total number of users/publications and `pages` which holds the total number of pages for this request
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
        'pages': nrOfPages
    };
};

/**
 * Takes a string and parses it as XML
 *
 * * deferred.reject    {String}    Error message
 * * deferred.resolve   {Object}    Object containing the XML data
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
    } catch(err) {
        return deferred.reject('Could not parse XML');
    }

    return deferred.promise;
};
