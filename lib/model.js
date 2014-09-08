var _ = require('underscore');
var util = require('util');

var Constants = require('./constants').Constants;
var ImportUtil = require('./util');

/**
 * A Symplectic publication model
 */
var SymplecticPublication = module.exports.SymplecticPublication = function(entry) {
    entry = entry['api:object'][0];

    var publicationType = entry['$']['type'];

    var publication = null;
    switch (publicationType) {
        case 'artefact':
            publication = new Artefact(entry);
            break;
        case 'book':
            publication = new Book(entry);
            break;
        case 'chapter':
            publication = new Chapter(entry);
            break;
        case 'conference':
            publication = new Conference(entry);
            break;
        case 'journal-article':
            publication = new JournalArtical(entry);
            break;
        case 'report':
            publication = new Report(entry);
            break;

        case 'thesis-dissertation':
            publication = new Thesis(entry);
            break;

        default:
            publication = null;
            break;
    }
    return publication;
};

/**
 * A publication model
 *
 * @param  {String}         displayName                 The title or display name for this publication
 * @param  {String}         publicationType             The format of the publication. (See `PublicationConstants.publicationTypes`)
 * @param  {Number}         date                        The date when the publication was published
 * @param  {String}         thumbnailUri                The url of the thumbnail
 * @param  {String[]}       authors                     A collection of authors
 * @param  {String}         publisher                   Although the name is slightly ambiguous, this field is intended for Journal Names, Book publishers...
 * @param  {Object}         [extra]                     Object containing extra values
 * @param  {String}         [extra.openAccessType]      The open access type (e.g. green, gold)
 * @param  {Number}         [extra.issueNumber]         The issue number of the journal the article was published in
 * @param  {Number}         [extra.pageBegin]           The page number of the magazine where the article starts
 * @param  {Number}         [extra.pageEnd]             The page number of the magazine where the article ends
 * @param  {String}         [extra.contactEmail]        The email address that will be used to contact the responsable person
 * @return {Publication}                                Object representing the publication
 */
var Publication = module.exports.Publication = function(displayName, publicationType, date, thumbnailUri, authors, publisher, extra) {
    var that = {};
    extra = extra || {};

    that.displayName = displayName;
    that.publicationType = publicationType;
    that.date = date;
    that.thumbnailUri = thumbnailUri;
    that.authors = authors;
    that.publisher = publisher;

    that.journalName = extra.journalName;
    that.issueNumber = extra.issueNumber;
    that.pageBegin = extra.pageBegin;
    that.pageEnd = extra.pageEnd;
    that.acceptanceDate = extra.acceptanceDate;

    that.funders = extra.funders;

    that.institution = extra.institution;
    that.department = extra.department;

    that.comments = extra.comments;

    return that;
};

/**
 * An artefact model
 */
var Artefact = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    return new Publication(displayName, Constants.publicationTypes.ARTEFACT, date);
};

/**
 * A book model
 */
var Book = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');

    var extra = {};
    var pagination = ImportUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = ImportUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    return new Publication(displayName, Constants.publicationTypes.BOOK, date, null, authors, publisher, extra);
};

/**
 * A chapter model
 */
var Chapter = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');

    var extra = {};
    var pagination = ImportUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = ImportUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    return new Publication(displayName, Constants.publicationTypes.CHAPTER, date, null, authors, publisher, extra);
};

/**
 * A conference model
 */
var Conference = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');

    var publisher = ImportUtil.getRecordFieldValue(record, 'name-of-conference');
    if (!publisher) {
        // Symplectic sticks published proceedings under the Conference type, so we can fallback to the journal if that's the case here
        publisher = ImportUtil.getRecordFieldValue(record, 'journal');
    }

    var extra = {};
    var pagination = ImportUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }

    var issue = ImportUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }

    return new Publication(displayName, Constants.publicationTypes.CONFERENCE, date, null, authors, publisher, extra);
};

/**
 * A journal artical model
 */
var JournalArtical = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'journal');

    var extra = {};
    var pagination = ImportUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = ImportUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    return new Publication(displayName, Constants.publicationTypes.JOURNAL_ARTICLE, date, null, authors, publisher, extra);
};

/**
 * A report model
 */
var Report = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');

    var extra = {};

    var confidential = ImportUtil.getRecordField(record, 'confidential');
    if (confidential && confidential['api:boolean'] && confidential['api:boolean'][0] === 'true') {
        return null;
    }
    return new Publication(displayName, Constants.publicationTypes.REPORT, date, null, authors, publisher, extra);
};

/**
 * A thesis model
 */
var Thesis = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;
    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'name-of-conference');

    var extra = {};
    return new Publication(displayName, Constants.publicationTypes.THESIS, date, null, authors, publisher, extra);
};
