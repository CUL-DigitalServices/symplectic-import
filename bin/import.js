#!/usr/bin/env node

var _ = require('underscore');
var colors = require('colors');
var fs = require('fs');
var progress = require('progress');
var q = require('q');
var util = require('util');
var yargs = require('yargs');

var Constants = require('../lib/symplectic/constants').Constants;
var SymplecticAPI = require('../lib/symplectic/api');
var ZenDeskAPI = require('../lib/zendesk/api');

var progressBar = null;

var argv = yargs
    .usage('Usage: ./bin/import.js --location [--created-since] [--ever-approved] [--groups] ["--content-types"]')

    .alias('-l')
    .describe('-l', 'The physical location where the file will be exported to (e.g. ~/Documents)')

    .alias('-c', 'created-since')
    .describe('-c', 'The insertion start date of the publications (e.g. 2014-09-01')

    .alias('-e', 'ever-approved')
    .describe('-e', 'Whether the publications need to be approved or not (default: true)')

    .alias('-g', 'groups')
    .describe('-g', 'The group where the publications belong to (e.g. 180)')

    .alias('-t', 'content-types')
    .describe('-t', 'The content type of the resources to fetch (e.g. "journal article, book")')
    .argv;

/**
 * Initialize the script
 *
 * @api private
 */
var init = function() {

    // Check if the parameter has been set
    if (!argv.l) {
        console.error('Location for exported file missing'.red);
        process.exit(0);
    }

    // Check if the specified location exists
    if (!fs.existsSync(argv.l)) {
        console.error('Invalid export location'.red);
        process.exit(0);
    }

    // Create a progress bar
    progressBar = new progress('importing [:bar] :percent', {'incomplete': ' ', 'total': 100, 'width': 50});

    // Perform the API request
    var opts = constructRequestOptions();
    SymplecticAPI.getPublications(opts)

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
 * Constructs a request options object based on the command line parameters
 *
 * @return {Object}     Object containing request parameters
 * @api private
 */
var constructRequestOptions = function() {
    var errors = [];

    // Request options object
    var opts = {};

    if (argv.c) {
        if (argv.c.length !== 10) {
            errors.push('Invalid value for \'created-since\'');
        }
        opts['created-since'] = util.format('%sT00:00:00+01:00', argv.c);
    }

    if (argv.e && argv.e !== 'true') {
        if (argv.e !== 'false') {
            errors.push('Invalid value for \'ever-approved\'');
        }
        opts['ever-approved'] = false;
    }

    if (argv.g) {
        opts['groups'] = argv.g;
    }

    if (argv.t) {
        opts['content-types'] = argv.t;
    }

    // Stop the progress if any errors occurred
    if (errors.length) {
        console.error(errors[0].red);
        process.exit(1);
    }

    return opts;
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

    if (!publications.length) {
        console.log('No publications found'.green);
        return deferred.resolve();
    }

    var fileName = util.format('%s/publications.json', argv.l);
    fs.writeFile(fileName, JSON.stringify(publications, null, 4), 'utf8', function(err) {
        if (err) {
            console.error(err.red);
            return deferred.reject('Error while exporting publications');
        }

        console.log(util.format('publications exported at %s', fileName).green);
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
