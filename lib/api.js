var _ = require('underscore');
var request = require('request');
var q = require('q');
var qs = require('querystring');
var util = require('util');
var xml2js = require('xml2js');

var Constants = require('./constants').Constants;
var CorrespondingAuthor = require('../lib/model').CorrespondingAuthor;
var SymplecticPublication = require('../lib/model').SymplecticPublication;

/**
 * Perform a request to the Symplectic API
 *
 * * deferred.reject    {String}            Error message
 * * deferred.notify    {Number}            The relational percentage of each loop
 * * deferred.resolve   {Publication[]}     A collection of publications
 *
 * @param  {Object}     opts                    Object containing request parameters
 * @param  {String}     [opts.content-types]    The content types. (e.g. "conference, journal article, book")
 * @param  {String}     [opts.created-since]    The date of insertion (e.g. 2014-09-01)
 * @param  {String}     [opts.detail]           Whether or not detailed records should be returned. (full|null)
 * @param  {Boolean}    [opts.ever-approved]    The status of approval
 * @param  {String}     [opts.groups]           The groups the publications belong to (e.g. 23,180)
 * @param  {String}     [opts.per-page]         Number of publications per page. (max 25 when detail is set to 'full')
 * @return {Promise}
 */
var getPublications = module.exports.getPublications = function(opts) {
    var deferred = q.defer();

    // Extend the request options with some standard parameters
    opts = _.extend({
        'detail': 'full',
        'ever-approved': true,
        'per-page': Constants.API['items-per-page']

    }, opts);

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
        var url = util.format('%s/%s?%s', Constants.API.URI, Constants.API.endpoint, qs.encode(_opts));

        // Send a request to the Symplectic API
        request({'url': url}, function(err, response, body) {
            if (err) {
                return deferred.reject(err);
            }

            // Parse the response body
            _parseXml(body)

                // Create a Symplectic publication for each entry
                .then(function(xml) {

                    var _publications = [];

                    // Check if results are returned
                    if (xml.feed['api:pagination'][0]['$']['results-count'] !== '0') {

                        // Check if the Symplectic API threw an error
                        if (xml.feed.entry[0]['api:error']) {
                            return deferred.reject(xml.feed.entry[0]['api:error'][0]['_']);
                        }

                        // Parse the publications
                        _publications = _.map(xml.feed.entry, function(entry) {
                            return new SymplecticPublication(entry);
                        });
                    }

                    // Return the filtered publications
                    return {
                        'publications': _filterResults(contentTypes, _publications),
                        'xml': xml
                    };
                })

                // Add the corresponding author to the publication
                .then(_decoratePublicationsWithAuthors)

                // Continue the loop
                .then(function(data) {

                    // Add a filtered collection of publications to the global publications collection
                    publications = _.union(publications, data.publications);

                    // Fetch the pagination object
                    var pagination = _getPagination(data.xml);

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
 * Add the corresponding author to the publication
 *
 * * deferred.reject    {String}    Error message
 * * deferred.resolve   {Object}    Object containing the decorated publications
 *
 * @param  {Object}         data                    Object passed in from the previous function
 * @param  {Publication[]}  data.publications       A collection of Symplectic publications
 * @param  {Object}         data.xml                The XML data
 * @api private
 */
var _decoratePublicationsWithAuthors = function(data) {
    var deferred = q.defer();

    // Cache the decorated publications
    var _publications = [];

    /**
     * Decorates a publication
     */
    var _decoratePublication = function() {
        if (!data.publications.length) {
            return deferred.resolve({'publications': _publications, 'xml': data.xml});
        }

        // Decorate the publication
        var publication = data.publications.pop(data.publications.length);

        // Get the corresponding author information
        _getAuthorByPublicationId(publication.id)

            .then(function(author) {

                // Add the author object to the publication
                publication.correspondingAuthor = author;

                // Add the decorated publication to the collection
                _publications.push(publication);

                // Decorate the next publication
                _decoratePublication();
            })

            .fail(function(err) {
                return deferred.reject(err);
            });
    };

    // Start decorating the publications
    _decoratePublication();

    return deferred.promise;
};

/**
 * Fetches the corresponding author's information based on the publication id
 *
 * * deferred.reject    {String}    Error message
 * * deferred.resolve   {Object}    Object containing the corresponding author's data
 *
 * @param  {String}     id      The corresponding author's id
 * @api private
 */
var _getAuthorByPublicationId = function(id) {
    var deferred = q.defer();

    // Request options object
    var opts = {
        'detail': 'full'
    };

    // Construct the request url
    var url = util.format('%s/%s/%s/relationships?%s', Constants.API.URI, Constants.API.endpoint, id, qs.encode(opts));

    // Request the corresponding author's information
    request({'url': url}, function(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }

        // Parse the response body
        _parseXml(body)

            // Create an author object for each entry
            .then(function(xml) {

                // Check if results are returned
                if (xml.feed['api:pagination'][0]['$']['results-count'] !== '0') {

                    // Check if the Symplectic API threw an error
                    if (xml.feed.entry[0]['api:error']) {
                        return deferred.reject(xml.feed.entry[0]['api:error'][0]['_']);
                    }

                    // Parse the authors
                    var _authors = _.map(xml.feed.entry, function(entry) {
                        return new CorrespondingAuthor(entry);
                    });

                    return deferred.resolve(_authors);
                }
            })

            .fail(function(err) {
                return deferred.reject(err);
            });
    });

    return deferred.promise;
};

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
 */
var _parseXml = function(str) {
    var deferred = q.defer();
    setTimeout(function() {
        try {
            var parser = new xml2js.Parser({'explicitArray': true});
            parser.parseString(str, function(err, xml) {
                if (err) {
                    return deferred.reject('Could not parse XML');
                }

                return deferred.resolve(xml);
            });
        } catch(err) {
            return deferred.reject('Could not parse XML');
        }
    }, 100);
    return deferred.promise;
};
