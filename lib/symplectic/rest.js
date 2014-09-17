var util = require('util');

var SymplecticAPI = require('./api');

/**
 * Request the publications
 *
 * @param  {Request}    req     The Express request object
 * @param  {Response}   res     The Express response object
 */
var getPublications = module.exports.getPublications = function(req, res) {

    // Cache the created errors
    var errors = [];

    // Request options object
    var opts = {};

    if (req.query.c) {
        if (req.query.c.length !== 10) {
            errors.push('Invalid value for \'created-since\'');
        }
        opts['created-since'] = util.format('%sT00:00:00+01:00', req.query.c);
    }

    if (req.query.e && req.query.e !== 'true') {
        if (req.query.e !== 'false') {
            errors.push('Invalid value for \'ever-approved\'');
        }
        opts['ever-approved'] = false;
    }

    if (req.query.g) {
        opts['groups'] = req.query.g;
    }

    if (req.query.t) {
        opts['content-types'] = req.query.t;
    }

    SymplecticAPI.getPublications(opts)

        .then(function(publications) {
            return res.status(200).send(publications);
        })

        .fail(function(err) {
            console.log(err);
            return res.status(400).send(err);
        });
};
