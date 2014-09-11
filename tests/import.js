#!/usr/bin/env node

var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var nock = require('nock');
var qs = require('querystring');
var request = require('request');
var util = require('util');

var API = require('../lib/api');
var Constants = require('../lib/constants').Constants;

describe('Symplectic import', function() {

    // Will be set as a function that is executed when sending requests to the API
    var onRequest = null;

    // Request options object
    var opts = {
        'detail': 'full',
        'ever-approved': true,
        'per-page': Constants.API['items-per-page']
    };

    /**
     * Utility method that returns publication XML
     *
     * @return {String}     The publication XML
     * @api private
     */
    var getPublications = function() {
        var file = __dirname + '/data/publications.xml';
        return fs.readFileSync(file, 'utf-8');
    };

    /**
     * Handles the mock request
     *
     * @param  {String}     uri             The request URI
     * @param  {Object}     requestBody     The request body
     * @return {String}                     The response body containing publication data
     * @api private
     */
    var handleRequest = function(uri, requestBody) {
        var xml = getPublications();
        return xml;
    };

    /**
     * Mocks the Symplectic API response
     *
     * @param  {String}     queryString     The request query string
     * @api private
     */
    var mockRequest = function(queryString) {
        var scope = nock(Constants.API.URI)
            .get(util.format('/%s?%s', Constants.API.endpoint, queryString))
            .reply(200, handleRequest);
    };

    /**
     * Test that verifies that Symplectic API requests return publication data
     */
    it('verify that the correct publications are returned when sending a request to the Symplectic API', function(callback) {

        // Create a request options object
        var _opts = _.extend(opts, {
            'created-since': util.format('%sT00:00:00+01:00', '2014-09-10'),
            'page': 1
        });

        // Intercept the mock request
        mockRequest(qs.encode(_opts));

        // Request the publications
        API.getPublications(_opts)

            .then(function(publications) {
                assert.ok(publications);
                return callback();
            })

            .fail(function(err) {
                assert.fail(err)
                return callback();
            });
    });
});
