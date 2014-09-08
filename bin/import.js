#!/usr/bin/env node

var _ = require('underscore');
var colors = require('colors');
var fs = require('fs');
var q = require('q');
var util = require('util');
var yargs = require('yargs');

var API = require('../lib/api');
var Constants = require('../lib/constants').Constants;

var argv = yargs
    .usage('Usage: ./bin/import.js --target-file [--groups] [--created-since] [--ever-approved]')

    .alias('-t')
    .describe('-t', 'The directory where the file will be exported to (e.g. ~/Documents)')

    .alias('-g', 'groups')
    .describe('-g', 'The group where the publications belong to')

    .alias('-c', 'created-since')
    .describe('-c', 'The insertion start date of the publications (e.g. 2014-09-01')

    .alias('-e', 'ever-approved')
    .describe('-e', 'Whether the publications need to be approved or not (default: true)')
    .argv;

/**
 * Initialize the script
 */
var init = function() {

    // Check if the parameter has been set
    if (!argv.t) {
        console.log('Location for exported file missing'.red);
        process.exit(0);
    }

    // Check if the specified location exists
    if (!fs.existsSync(argv.t)) {
        console.log('Invalid export location'.red);
        process.exit(0);
    }

    // Perform the API request
    API.doRequest(constructQueryString())

        // Export the results
        .then(exportResults)

        // Errorhandler
        .catch(function(err) {
            console.log(err);
        });
};

/**
 * Exports the results to a JSON-file
 *
 * @param {Publication[]}   publications    A collection of publications
 * @return {Promise}
 * @api private
 */
var exportResults = function(publications) {
    var deferred = q.defer();

    var fileName = util.format('%s/publications.json', argv.t);
    fs.writeFile(fileName, JSON.stringify(publications, null, 4), 'utf8', function(err) {
        if (err) {
            return deferred.reject('Error while exporting publications');
        }

        console.log(util.format('publications exported at %s', fileName).green);
        deferred.resolve();
    });

    return deferred.promise;
};

/**
 * Constructs a query string based on the command line parameters
 *
 * @return {String}     The created query string
 */
var constructQueryString = function() {
    var errors = [];

    // Caches the query string parameters
    var queryString = ['detail=full'];

    if (argv.g) {
        queryString.push(util.format('groups=%s', argv.g));
    }

    if (argv.c) {
        if (argv.c.length !== 10) {
            errors.push('Invalid value for \'created-since\'');
        }
        queryString.push(util.format('created-since=%sT00%3A00%3A00%2B01%3A00', argv.c))
    }

    var everApproved = true;
    if (argv.e && argv.e !== 'true') {
        if (argv.e !== 'false') {
            errors.push('Invalid value for \'ever-approved\'');
        }
        everApproved = false;
    }
    queryString.push(util.format('ever-approved=%s', everApproved));

    // Stop the progress if any errors occurred
    if (errors.length) {
        console.log(errors[0].red);
        process.exit(1);
    }

    // Return the created query string
    return util.format('%s?%s', Constants.API.URI, queryString.sort().join('&'));
};

init();
