#!/usr/bin/env node

var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var nock = require('nock');
var qs = require('querystring');
var util = require('util');

var API = require('../lib/symplectic/api');
var Constants = require('../lib/symplectic/constants').Constants;

describe('Symplectic import', function() {

    // Request options object
    var opts = {
        'created-since': util.format('%sT00:00:00+01:00', '2014-09-10'),
        'detail': 'full',
        'ever-approved': true,
        'page': 1,
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
     * Mocks the Symplectic API response
     *
     * @param  {String}     opts    Object containing request options
     * @api private
     */
    var mockRequest = function(opts) {
        var _opts = _.clone(opts);
        if (_opts['content-types']) {
            delete _opts['content-types'];
        }

        var queryString = qs.encode(_opts);
        var scope = nock(Constants.API.URI)
            .get(util.format('/%s?%s', Constants.API.endpoint, queryString))
            .reply(200, getPublications);
    };

    /**
     * Test that verifies that Symplectic API requests return publication data
     */
    it('verify that publications are returned successfully when sending a request to the Symplectic API', function(callback) {

        // Intercept the mock request
        mockRequest(opts);

        // Request the publications
        API.getPublications(opts)

            .then(function(publications) {
                assert.ok(publications);
                assert.equal(publications.length, 13);
                _.each(publications, function(publication) {
                    assert.ok(_.indexOf(Constants.sources, publication.source) > -1);
                });
                return callback();
            })

            .fail(function(err) {
                assert.fail(err);
                return callback();
            });
    });

    /**
     * Test that verifies that the correct publications are returned when specifying a publication type
     */
    it('verify that the correct publications are returned when specifying a publication type', function(callback) {

        // Set the content type as journal article
        var _opts = _.extend(opts, {
            'content-types': 'journal article'
        });

        // Intercept the mock request
        mockRequest(_opts);

        // Request the publications
        API.getPublications(_opts)

            .then(function(publications) {
                assert.ok(publications);
                assert.equal(publications.length, 12);
                _.each(publications, function(publication) {
                    assert.ok(_.indexOf(Constants.sources, publication.source) > -1);
                    assert.strictEqual(publication.publicationType, 'journal article');
                });
                return callback();
            })

            .fail(function(err) {
                assert.fail(err);
                return callback();
            });
    });
});
