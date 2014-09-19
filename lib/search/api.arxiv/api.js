var _ = require('underscore');
var q = require('q');
var qs = require('querystring');
var request = require('request');
var util = require('util');

var config = require('../../../config');

var ImportConstants = require('../constants').Constants;
var ImportUtil = require('../util');

var ArxivConstants = require('./constants').Constants;
var ArxivPublication = require('./model').ArxivPublication;
var ArxivUtil = require('./util');

/**
 * ArXiv API
 * @see http://arxiv.org/help/api/user-manual
 *
 *  * Search request parameters
 *  *
 *  * @param  {String}      [search_query]      Default none    The search query. Optional
 *  * @param  {String}      [id_list]           Default none    Comma-delimited article id's. Optional
 *  * @param  {Number}      [start]             Default 0       The offset. Optional
 *  * @param  {Number}      [max_results]       Default 10      Number of results per page. Optional
 *  * @param  {String}      [sortBy]            Default none    The sort parameter (e.g. 'relevance', 'lastUpdatedDate', 'submittedDate'). Optional
 *  * @param  {String}      [sortOrder]         Default none    The sort order (e.g. 'ascending', 'descending'). Optional
 *  *
 *  * search_query
 *  *   - cat               The subject category (e.g. astro-ph*). Optional
 *  *   - grp               The group (e.g. grp_physics). Optional
 *  *   - submittedDate     The date of submissions. Using 'TO' is mandatory: [yyyymmddHHMM+TO+yyyymmddHHMM] (e.g. [200401010000+TO+200412312359]). Optional
 *  *
 *  * Concatinating search query parameters can be done by adding 'AND' or 'OR' between the parameters. A '+' sign represents a space.
 *  *
 *  * Examples:
 *  *   - ?search_query=cat:astro-ph*+AND+submittedDate:[201401010000+TO+201401312359]
 */

/**
 * Perform a request to the arXiv API
 *
 *  * deferred.reject       {String}            Error message
 *  * deferred.notify       {Number}            The relational percentage of each loop
 *  * deferred.resolve      {Publication[]}     A collection of publications
 *
 * @param  {Object}     opts                    Object containing request parameters
 */
var getPublications = module.exports.getPublications = function(opts) {
    var deferred = q.defer();

    var itemsPerPage = config.arxiv['items-per-page'];

    // Search query parameters
    var search_query = [];

    // Check if the group/subject is specified
    var group = opts['groups'];
    if (group) {
        search_query.push(util.format('cat:%s', ImportConstants.departments[group].arxiv));
    }

    // Check if the author ID's are specified
    var authorIds = null;
    if (opts['author-ids']) {
        authorIds = _.chain(_.map(opts['author-ids'].split(','), function(authorId) {
            return authorId.trim();
        })).compact().value().join(',');
        search_query.push(util.format('au:%s', authorIds));
    }

    // Construct the date range
    var createdSince = opts['created-since'];
    if (createdSince) {
        var createdSince = createdSince.replace(/-/g, '');
        var start = util.format('%s0000', createdSince);
        var end = ArxivUtil.getCurrentDate();
        search_query.push(util.format('submittedDate:[%s+TO+%s]', start, end));
    }

    // Construct the search query
    search_query = util.format('search_query=%s', search_query.join('+AND+'));

    // Cache the publications
    var publications = [];

    /*!
     * Fetches a specific page from the arXiv API
     *
     * @param  {Number}     offset      The record offset
     * @param  {Number}     attempts    The number of attempts
     * @api private
     */
    var _getPublicationsPage = function(offset, attempts) {
        attempts = attempts || 1;
        if (attempts > 10) {
            return deferred.reject('Unable to fetch ArXiv publications');
        }

        var queryString = util.format('%s&max_results=%s&start=%s', search_query, itemsPerPage, offset);
        var url = util.format('%s?%s', config.arxiv.uri, queryString);

        // Send a request to the ArXiv API
        request({'url': url}, function(err, response, body) {
            if (err) {
                return deferred.reject(err);
            }

            ImportUtil.parseXml(body)

                .then(function(xml) {

                    var totalItems = parseInt(xml.feed['opensearch:totalResults'][0]['_'], 10);

                    // Calculate the pagination
                    var pages = Math.ceil(totalItems / itemsPerPage);
                    var page = Math.ceil(offset / itemsPerPage);

                    // Return an empty array if the query didn't return any results
                    if (totalItems === 0) {
                        return deferred.resolve([]);
                    }

                    // Retry fetching the page if an empty result was returned
                    if (!xml.feed.entry) {
                        console.log(util.format('ArXiv API returned empty result for pages %s/%s. Retrying...', pages, pages));
                        return _getPublicationsPage(offset, attempts += 1);
                    }

                    var _publications = [];

                    // Create an ArXiv publicaton for each entry
                    _publications = _.map(xml.feed.entry, function(entry) {
                        return new ArxivPublication(entry);
                    });

                    // Add the publications to the global collection
                    publications = _.union(publications, _publications);

                    // Notify the parent class
                    deferred.notify({'arxiv': {'total': pages, 'current': page}});

                    // Return the publications if all the pages have been fetched
                    if (offset >= (totalItems - itemsPerPage)) {
                        return deferred.resolve(publications);

                    // Continue the loop
                    } else {

                        // Update the offset
                        offset = (offset += itemsPerPage);

                        // Wait 500ms before fetching the next page
                        setTimeout(_getPublicationsPage, 250, offset, 1);
                    }
                })

                .fail(function(err) {
                    return deferred.reject(err);
                });
        });
    };

    // Fetch the first page
    _getPublicationsPage(0);

    return deferred.promise;
};

////////////////
//  INTERNAL  //
////////////////

/**
 * Adjusts the date
 *
 * @param  {String}     date    The date that needs te be adjusted
 * @return {String}             The adjusted date
 * @api private
 */
var adjustDate = function(date) {
    return date;
};
