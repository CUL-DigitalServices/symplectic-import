var _ = require('underscore');
var util = require('util');

var Constants = require('./constants').Constants;

///////////////
//  AUTHORS  //
///////////////

/**
 * Returns the value for a specified field
 */
var getAuthorField = module.exports.getAuthorField = function(record, field) {
    var value = null;
    if (record[field]) {
        value = record[field][0];
    }
    return value;
};

////////////////////
//  PUBLICATIONS  //
////////////////////

/**
 * Fetches the record data from the entry
 *
 * @param  {Object}     entry       Object containing entry data
 * @return {Object}                 The record data
 */
var getRecordData = module.exports.getRecordData = function(entry) {
    var records = entry['api:records'][0]['api:record'];
    if (!_.isArray(records)) {
        records = [records];
    }

    // Prefilter the records, based on their source
    var preferredRecord = records[0];
    var _records = _.filter(records, function(record) { return (_.indexOf(Constants.sources, record['$']['source-name']) > -1); });
    if (_records.length) {
        preferredRecord = _records[0];
    }

    var sourceIds = [];
    _.each(records, function(record) {

        // Add a source ID for each record. Source IDs will look like `pubmed:123456`, `wos:1234`, `symplectic-manual:uuid`...
        var sourceName = getRecordSource(record);

        // `manual` is the name for data that was entered into symplectic by hand. In order to not confuse this with
        // other ingesters, we change it to `symplectic-manual`
        if (sourceName === 'manual') {
            sourceName = 'symplectic-manual';
        }
        sourceIds.push(util.format('%s#%s', sourceName, record['$']['id-at-source']));
    });

    return {
        'sourceIds': sourceIds,
        'preferredRecord': preferredRecord
    };
};

/**
 * Returns a specified field from the record data
 *
 * @param  {Object}     record      Object containing record data
 * @param  {String}     fieldName   The name of the property that needs to be retrieved
 * @return {Object}                 The record field
 */
var getRecordField = module.exports.getRecordField = function(record, fieldName) {
    var field = _.find(record['api:native'][0]['api:field'], function(field) {
        return (field['$']['name'] === fieldName);
    });
    return field;
};

/**
 * Returns a record field, specified by its type
 *
 * @param  {Object}     record      Object containing record data
 * @param  {String}     fieldName   The name of the property that needs to be retrieved
 * @return {Object}                 The requested field
 */
var getRecordFieldByType = module.exports.getRecordFieldByType = function(record, typeValue) {
    var field = _.find(record['api:native'][0]['api:field'], function(field) {
        return (field['$']['type'] === typeValue);
    });
    return field;
};

/**
 * Returns the value of a record field by its field name
 *
 * @param  {Object}     record      Object containing record data
 * @param  {String}     fieldName   The name of the property that needs to be retrieved
 * @return {Object}                 The requested field value
 */
var getRecordFieldValue = module.exports.getRecordFieldValue = function(record, fieldName) {
    var field = getRecordField(record, fieldName);
    if (field) {
        return field['api:text'][0];
    } else {
        return null;
    }
};

/**
 * Returns the record's issue data
 *
 * @param  {Object}     record      Object containing record data
 * @return {String}                 The record's issue data
 */
var getIssue = module.exports.getIssue = function(record) {
    var volumeField = getRecordField(record, 'volume');
    var issueField = getRecordField(record, 'issue');
    var volumeText = (volumeField) ? volumeField['api:text'] : '';
    var issueText = (issueField) ? issueField['api:text'] : '';
    return util.format('vol %s issue %s', volumeText, issueText);
};

/**
 * Returns the record's pagination data
 *
 * @param  {Object}     record      Object containing record data
 * @return {Object}                 The record's pagination data
 */
var getPagination = module.exports.getPagination = function(record) {
    var paginationField = getRecordField(record, 'pagination');
    if (!paginationField) {
        return {};
    }

    var pagination = {};
    if (paginationField['api:pagination'][0]['api:begin-page'] && paginationField['api:pagination'][0]['api:begin-page'] !== 'n/a') {
        pagination.pageBegin = paginationField['api:pagination'][0]['api:begin-page'];
    }
    if (paginationField['api:pagination'][0]['api:end-page'] && paginationField['api:pagination'][0]['api:end-page'] !== 'n/a') {
        pagination.pageEnd = paginationField['api:pagination'][0]['api:end-page'];
    }

    return pagination;
};

/**
 * Returns the record's date value
 *
 * @param  {Object}     entry       Object containing entry data
 * @param  {Object}     record      Object containing record data
 * @param  {String}     fieldName   The name of the property that needs to be retrieved
 * @return {String}                 The record's date value
 */
var getDateValue = module.exports.getDateValue = function(entry, record, fieldName) {
    // Try to get it from the preferred record
    var dateField = getRecordField(record, fieldName);

    // If there is no date field in the preferred record, we can check the other sources
    // We only do this as its vital to store the publication
    if (!dateField) {
        var records = entry['api:records'][0]['api:record'];
        if (!_.isArray(records)) {
            records = [records];
        }
        for (var i = 0; i < records.length && !dateField; i++) {
            dateField = getRecordField(records[i], fieldName);
        }
    }

    if (dateField) {
        var date = new Date(0);
        if (dateField['api:date'][0]['api:year']) {
            date.setFullYear(parseInt(dateField['api:date'][0]['api:year'][0], 10));
        }
        if (dateField['api:date'][0]['api:month']) {
            date.setMonth(parseInt(dateField['api:date'][0]['api:month'][0], 10) - 1);
        }
        if (dateField['api:date'][0]['api:day']) {
            date.setDate(parseInt(dateField['api:date'][0]['api:day'][0], 10));
        }
        return date.getTime();
    }
};

/**
 * Returns the record's authors
 *
 * @param  {Object}     record      Object containing record data
 * @param  {String}     fieldName   The name of the property that needs to be retrieved
 * @return {String[]}               A collection of authors
 */
var getAuthors = module.exports.getAuthors = function(record, fieldName) {
    var authorsField = getRecordFieldByType(record, 'person-list');
    var authors = [];
    if (authorsField) {
        _.each(authorsField['api:people'][0]['api:person'], function(person) {
            authors.push(person['api:last-name'] + ' ' + person['api:initials']);
        });
    }
    return authors;
};

/**
 * Returns the resource' file location
 *
 * @param  {Object}     record      Object containing record data
 * @return {String}
 */
var getFile = module.exports.getFile = function(record) {
    var files = record['api:native'][0]['api:files'];
    if (files) {
        var file = record['api:native'][0]['api:files'][0]['api:file'][0];
        return util.format('%s.%s', file['api:file-url'][0], file['api:extension'][0]);
    }
    return null;
};

/**
 * Returns the record's source
 *
 * @param  {Object}     record      Object containing record data
 * @return {String}                 The record's source
 */
var getRecordSource = module.exports.getRecordSource = function(record) {
    return record['$']['source-name'];
};
