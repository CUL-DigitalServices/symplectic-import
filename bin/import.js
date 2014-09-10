#!/usr/bin/env node

var _ = require('underscore');
var colors = require('colors');
var fs = require('fs');
var progress = require('progress');
var q = require('q');
var util = require('util');
var yargs = require('yargs');

var API = require('../lib/api');
var Constants = require('../lib/constants').Constants;

var progressBar = null;

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
 *
 * @api private
 */
var init = function() {

    // Check if the parameter has been set
    if (!argv.t) {
        console.error('Location for exported file missing'.red);
        process.exit(0);
    }

    // Check if the specified location exists
    if (!fs.existsSync(argv.t)) {
        console.error('Invalid export location'.red);
        process.exit(0);
    }

    // Create a progress bar
    progressBar = new progress('importing [:bar] :percent', {'incomplete': ' ', 'total': 100, 'width': 50});

    // Perform the API request
    API.getPublications(constructQueryString())

        // Progress handler
        .progress(progressHandler)

        // Export the results
        .then(exportResults)

        // Errorhandler
        .fail(function(err) {
            console.error(err.red);
            process.exit(2);
        });
};

/**
 * Constructs a query string based on the command line parameters
 *
 * @return {String[]}   Collection of query string parameters
 * @api private
 */
var constructQueryString = function() {
    var errors = [];

    // Caches the query string parameters
    var itemsPerPage = util.format('per-page=%s', Constants.API['items-per-page'])
    var queryString = ['detail=full', itemsPerPage];

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
        console.error('\n' + errors[0].red);
        process.exit(1);
    }

    return queryString;
};

/**
 * Exports the results to a JSON-file
 *
 * * deferred.reject    {String}    Error message
 * * deferred.resolve   {Object}    Object containing the XML datanull
 *
 * @param  {Publication[]}  publications    A collection of publications
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

        console.log(util.format('\npublications exported at %s', fileName).green);
        process.exit(4);
    });

    return deferred.promise;
};

/**
 * Handle the progress of requesting the publications
 *
 * @param  {Number}     val     The value that needs to be added to the progress bar
 * @api private
 */
var progressHandler = function(val) {
    progressBar.tick(val);
};

init();
