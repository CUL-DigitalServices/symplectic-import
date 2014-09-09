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
            publication = new JournalArticle(entry);
            break;
        case 'other':
            publication = new Other(entry);
            break;
        case 'report':
            publication = new Report(entry);
            break;
        case 'thesis-dissertation':
            publication = new Thesis(entry);
            break;

        default:
            publication = new Other(entry);
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
 * @param  {String[]}       authors                     A collection of authors
 * @param  {String}         publisher                   Although the name is slightly ambiguous, this field is intended for Journal Names, Book publishers...
 * @param  {String}         publicationStatus           The publication status
 * @param  {Object}         [extra]                     Object containing extra values
 * @param  {String}         [extra.openAccessType]      The open access type (e.g. green, gold)
 * @param  {Number}         [extra.eissn]               The eISSN
 * @param  {Number}         [extra.issn]                The ISSN
 * @param  {Number}         [extra.issueNumber]         The issue number of the journal the article was published in
 * @param  {Number}         [extra.pageBegin]           The page number of the magazine where the article starts
 * @param  {Number}         [extra.pageEnd]             The page number of the magazine where the article ends
 * @param  {String}         [extra.comments]            Any additional comments on the entry
 * @return {Publication}                                Object representing the publication
 */
var Publication = module.exports.Publication = function(displayName, publicationType, source, date, authors, publisher, publicationStatus, extra) {
    var that = {};
    extra = extra || {};

    that.displayName = displayName;
    that.publicationType = publicationType;
    that.source = source;
    that.date = date;
    that.authors = authors;
    that.publisher = publisher;
    that.publicationStatus = publicationStatus;

    // One of `null`, `gold` or `silver`
    that.openAccessType = extra.openAccessType;

    that.eissn = extra.eissn;
    that.issn = extra.issn;
    that.issueNumber = extra.issueNumber;
    that.pageBegin = extra.pageBegin;
    that.pageEnd = extra.pageEnd;

    that.comments = extra.comments;

    return that;
};

/**
 * An 'artefact' model
 */
var Artefact = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.ARTEFACT, source, date, null, null, publicationStatus, extra);
};

/**
 * A 'book' model
 */
var Book = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

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
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.BOOK, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'chapter' model
 */
var Chapter = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

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
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.CHAPTER, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'conference' model
 */
var Conference = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');

    var publisher = ImportUtil.getRecordFieldValue(record, 'name-of-conference');
    if (!publisher) {
        // Symplectic sticks published proceedings under the Conference type, so we can fallback to the journal if that's the case here
        publisher = ImportUtil.getRecordFieldValue(record, 'journal');
    }

    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

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
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.CONFERENCE, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'journal article' model
 */
var JournalArticle = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'journal');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

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
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.JOURNAL_ARTICLE, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * An 'other' model
 */
var Other = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = ImportUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.OTHER, source, date, authors, null, publicationStatus, extra);
};

/**
 * A 'report' model
 */
var Report = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var confidential = ImportUtil.getRecordField(record, 'confidential');
    if (confidential && confidential['api:boolean'] && confidential['api:boolean'][0] === 'true') {
        return null;
    }
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.REPORT, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'thesis' model
 */
var Thesis = function(entry) {
    var data = ImportUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var displayName = ImportUtil.getRecordFieldValue(record, 'title');
    var source = ImportUtil.getRecordSource(record);
    var date = ImportUtil.getDateValue(entry, record, 'publication-date');
    var authors = ImportUtil.getAuthors(record, 'authors');
    var publisher = ImportUtil.getRecordFieldValue(record, 'name-of-conference');
    var publicationStatus = ImportUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var comments = ImportUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }

    return new Publication(displayName, Constants.publicationTypes.THESIS, source, date, authors, publisher, publicationStatus, extra);
};
