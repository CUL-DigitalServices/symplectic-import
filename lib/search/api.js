var _ = require('underscore');
var q = require('q');
var util = require('util');

var ArxivAPI = module.exports.ArxivAPI = require('./api.arxiv/api');
var SymplecticAPI = module.exports.SymplecticAPI = require('./api.symplectic/api');

var ImportUtil = require('./util');

/**
 * Function that fetches the publications from multiple external API's
 *
 * @param  {Object}     opts                    Object containing request parameters
 * @param  {String}     [opts.content-types]    The content types. (e.g. "conference, journal article, book")
 * @param  {String}     [opts.created-since]    The date of insertion (e.g. 2014-09-01)
 * @param  {String}     [opts.groups]           The groups the publications belong to (e.g. 23,180)
 * @return {Promise}
 */
var getPublications = module.exports.getPublications = function(opts) {
    var deferred = q.defer();

    // Cache the ArXiv records
    var arxiv = [];

    // Get the publications from the ArXiv API
    ArxivAPI.getPublications(_.clone(opts))

        // Prepare the Symplectic request
        .then(function(results) {
            if (!results.length) {
                return deferred.resolve();
            }

            // Cache the ArXiv records
            arxiv = results;
            // Fetch the date of the author's first publication
            opts['created-since'] = arxiv[0].date.substring(0,10);
            return opts;
        })

        // Execute the Symplectic request
        .then(SymplecticAPI.getPublications)

        .then(function(symplectic) {
            return {
                'arxiv': arxiv,
                'symplectic': symplectic
            }
        })

        // Compare both the result sets
        .then(compareResults)

        // Return the comparison
        .then(function(results) {
            return deferred.resolve(results);
        })

        .progress(function(progress) {
            deferred.notify(progress);
        })

        .fail(function(err) {
            return deferred.reject(err);
        });

    return deferred.promise;
};

/**
 * Compares the publications
 *
 * @param  {Object}             publications                Object containing the result sets
 * @param  {Publication[]}      publications.arxiv          A collection of ArXiv publications
 * @param  {Publication[]}      publications.symplectic     A collection of Symplectic publications
 * @return {Object}                                         Object containing comparison data and the publications
 * @api private
 */
var compareResults = function(publications) {

    // Results object
    var results = {
        'matching': [],
        'unmatching': [],
        'stats': {
            'numRecords': {
                'arxiv': publications.arxiv.length,
                'symplectic': publications.symplectic.length
            },
            'matching': 0
        }
    };

    // Loop the ArXiv publications
    _.each(publications.arxiv, function(ArxivPublication, index) {

        // The ArXiv publication id
        var arxivID = ImportUtil.getArxivIdFromString(ArxivPublication.id);

        // Keep track of the score
        var score = 0;
        var matchingPublication = null;

        // Loop the Symplectic publications
        _.each(publications.symplectic, function(SymplecticPublication) {

            // Check if the publication's file is ArXiv
            if (SymplecticPublication.source === 'arxiv') {

                // Check if the publication has a file associated with
                if (SymplecticPublication.file) {
                    var symplecticID = ImportUtil.getArxivIdFromString(SymplecticPublication.file);

                    if (arxivID === symplecticID) {
                        matchingPublication = SymplecticPublication;
                        score++;
                    }
                }
            }

            // Check if both the titles match
            if (ArxivPublication.displayName === SymplecticPublication.displayName) {
                matchingPublication = SymplecticPublication;
                score++;
            }
        });

        // Cache the matching Symplectic publication
        if (score) {
            var match = {
                'score': score,
                'publications': {
                    'arxiv': ArxivPublication,
                    'symplectic': matchingPublication
                }
            };
            results.matching.push(match);
        } else {
            results.unmatching.push(ArxivPublication);
        }
    });

    results.stats.matching = results.matching.length;

    return results;
};
