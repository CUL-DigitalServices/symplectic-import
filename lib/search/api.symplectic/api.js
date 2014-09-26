var _ = require('underscore');
var q = require('q');
var qs = require('querystring');
var request = require('request');
var util = require('util');

var config = require('../../../config');

var ImportConstants = require('../constants').Constants;
var ImportUtil = require('../util');

var CorrespondingAuthor = require('./model').CorrespondingAuthor;
var SymplecticConstants = require('./constants').Constants;
var SymplecticPublication = require('./model').SymplecticPublication;

// Cache the retrieved publications
var publications = [];

/**
 * Symplectic API
 * @see https://symplectic.zendesk.com
 *
 *  * Category request parameters:
 *  *
 *  * @param  {String}      [created-since]         Default none    The date of insertion (e.g. 2014-06-01T00:00:00+01:00)
 *  * @param  {String}      [detail]                Default none    Whether or not full records should be returned (max 25 per page if 'full')
 *  * @param  {Boolean}     [ever-approved]         Default false   Whether or not the records have been approved
 *  * @param  {String}      [groups]                Default none    The group ID (e.g. 180)
 */

/**
 * Perform a request to the Symplectic API
 *
 * * deferred.reject    {String}                Error message
 * * deferred.notify    {Number}                The relational percentage of each loop
 * * deferred.resolve   {Publication[]}         A collection of publications
 *
 * @param  {Object}     opts                    Object containing request parameters
 * @param  {String}     [opts.content-types]    The content types. (e.g. "conference, journal article, book")
 * @param  {String}     [opts.created-since]    The date of insertion (e.g. 2014-09-01)
 * @param  {String}     [opts.groups]           The groups the publications belong to (e.g. 23,180)
 * @return {Promise}
 */
var getPublications = module.exports.getPublications = function(opts) {
    var deferred = q.defer();

    // Reset the previously fetched publications
    publications = [];

    // Remove the author ids from the options
    if (opts['author-ids']) {
        delete opts['author-ids'];
    }

    // Replace the groups value if it has been set
    var group = opts['groups'];
    if (group) {
        opts['groups'] = ImportConstants.departments[group].symplectic;
    }

    // Extend the request options with some standard parameters
    opts = _.extend({
        'created-since': util.format('%sT00:00:00+01:00', opts['created-since']),
        'detail': 'full',
        'ever-approved': true,
        'per-page': config.symplectic['items-per-page']
    }, opts);

    // Remove the content-type from the options since this is an internal parameter
    var contentTypes = [];
    if (opts['content-types']) {
        contentTypes = opts['content-types'].split(',');
        delete opts['content-types'];
    }

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
        var url = util.format('%s/%s?%s', config.symplectic.uri, config.symplectic.endpoint, qs.encode(_opts));

        // Send a request to the Symplectic API
        request({'url': url}, function(err, response, body) {
            if (err) {
                return deferred.reject(err);
            }

            // Parse the response body
            ImportUtil.parseXml(body)

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

                    // Notify the parent class
                    deferred.notify({'symplectic': {'total': pagination.pages, 'current': page}});

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
                    console.log('\nError:');
                    console.log(err);
                    return deferred.reject(err);
                });
        });
    };

    // Request the first page
    _getPublicationsPage(1);

    return deferred.promise;
};

/**
 * Returns a specific publication by its id
 *
 * @param  {Number}         id      The id of the publication
 * @return {Publication}            Object representing a publication
 */
var getPublication = module.exports.getPublication = function(id) {
    return _.filter(publications, function(publication) {
        return publication.id === id;
    });
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
        if (_.indexOf(SymplecticConstants.sources, publication.source) > -1) {

            // Only return publications with specified publication types
            if ((contentTypes.length && _.indexOf(contentTypes, publication.publicationType) > -1) || !contentTypes.length) {
                return publication;
            }
        }
    })).compact().value();
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
    var url = util.format('%s/%s/%s/relationships?%s', config.symplectic.uri, config.symplectic.endpoint, id, qs.encode(opts));

    // Request the corresponding author's information
    request({'url': url}, function(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }

        // Parse the response body
        ImportUtil.parseXml(body)

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
