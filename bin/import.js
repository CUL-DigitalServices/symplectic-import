#!/usr/bin/env node

var _ = require('underscore');
var q = require('q');
var request = require('request');
var util = require('util');
var xml2js = require('xml2js');
var yargs = require('yargs');

var Constants = require('../lib/constants').Constants;
var SymplecticPublication = require('../lib/model').SymplecticPublication;

var argv = yargs
    .usage('Usage: ./bin/import.js [--groups] [--created-since] [--ever-approved]')

    .alias('-g', 'groups')
    .describe('-g', 'The group where the publications belong to')

    .alias('-c', 'created-since')
    .describe('-c', 'The insertion start date of the publications (e.g. 2014-09-01')

    .alias('-e')
    .describe('-e', 'Whether the publications need to be approved or not (default: true).')

    .argv;

/**
 * Constructs a query string based on the command line parameters
 *
 * @return {String}     The created query string
 */
var constructQueryString = function() {
    var queryString = ['detail=full'];

    if (argv.g) {
        queryString.push(util.format('groups=%s', argv.g));
    }

    if (argv.c) {
        if (argv.c.length !== 10) {
            return console.log('Invalid value for \'created-since\'');
        }
        queryString.push(util.format('created-since=%sT00%3A00%3A00%2B01%3A00', argv.c))
    }

    var everApproved = true;
    if (argv.e && argv.e !== 'true') {
        if (argv.e !== 'false') {
            return console.log('Invalid value for \'ever-approved\'');
        }
        everApproved = false;
    }
    queryString.push(util.format('ever-approved=%s', everApproved));
    return util.format('%s?%s', Constants.API.URI, queryString.sort().join('&'));
};

/**
 * Perform a request to the Symplectic API
 *
 * @api private
 */
var doAPIRequest = function() {
    var url = constructQueryString();

    // Send a request to the Symplectic API
    request({'url': url}, function(err, response) {
        if (err) {
            console.log(err);
        }

        // Parse the response body
        parseXml(response.body)

            // Parse the results
            .then(parseResults)

            // Errorhandler
            .catch(function(err) {
                console.log(err);
            });
    });
};

/**
 * Takes a string and parses it as XML
 *
 * @param  {String}     str     The string to parse
 * @api private
 */
var parseXml = function(str) {
    var deferred = q.defer();

    try {
        var parser = new xml2js.Parser({'explicitArray': true});
        parser.parseString(str, function(err, xml) {
            if (err) {
                return deferred.reject({'code': 500, 'msg': 'Could not parse XML'})
            }
            return deferred.resolve(xml);
        });
    } catch (error) {
        return deferred.reject({'code': 500, 'msg': 'Could not parse XML'})
    }

    return deferred.promise;
};

/**
 * Parses the publications
 *
 * @param  {String}     xml                 Object containing the XML data
 * @api private
 */
var parseResults = function(xml) {

    // Loop the entries
    var entries = _.map(xml.feed.entry, function(entry) {
        return new SymplecticPublication(entry);
    });

    return entries;
};

doAPIRequest();
