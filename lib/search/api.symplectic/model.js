var _ = require('underscore');
var util = require('util');

var Publication = require('../model').Publication;

var Constants = require('./constants').Constants;
var SymplecticUtil = require('./util');

/**
 * A Symplectic publication model
 *
 * @param  {Object}     entry   A Symplectic publication entry
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
 * A corresponding author model
 *
 * @param  {Object}     entry   A Symplectic relationship entry
 */
var CorrespondingAuthor = module.exports.CorrespondingAuthor = function(entry) {
    var record = entry['api:relationship'][0]['api:related'][0]['api:object'][0];

    var author = {};

    try {
        author.isAcademic = SymplecticUtil.getAuthorField(record, 'api:is-academic');
        author.isCurrentStaff = SymplecticUtil.getAuthorField(record, 'api:is-current-staff');
        author.title = SymplecticUtil.getAuthorField(record, 'api:title');
        author.initials = SymplecticUtil.getAuthorField(record, 'api:initials');
        author.firstName = SymplecticUtil.getAuthorField(record, 'api:first-name');
        author.lastName = SymplecticUtil.getAuthorField(record, 'api:last-name');
        author.academicName = String(author.title + ' ' + author.initials + ' ' + author.lastName).trim();
        author.emailAddress = SymplecticUtil.getAuthorField(record, 'api:email-address');
        author.primaryGroupDescriptor = SymplecticUtil.getAuthorField(record, 'api:primary-group-descriptor');

    } catch(err) {
        console.log(err);
    }

    return author;
};

/**
 * An 'artefact' model
 */
var Artefact = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.ARTEFACT, source, date, null, null, publicationStatus, extra);
};

/**
 * A 'book' model
 */
var Book = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = SymplecticUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = SymplecticUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.BOOK, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'chapter' model
 */
var Chapter = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = SymplecticUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = SymplecticUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.CHAPTER, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'conference' model
 */
var Conference = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');

    var publisher = SymplecticUtil.getRecordFieldValue(record, 'name-of-conference');
    if (!publisher) {
        // Symplectic sticks published proceedings under the Conference type, so we can fallback to the journal if that's the case here
        publisher = SymplecticUtil.getRecordFieldValue(record, 'journal');
    }

    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = SymplecticUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }

    var issue = SymplecticUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.CONFERENCE, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'journal article' model
 */
var JournalArticle = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'journal');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = SymplecticUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var issue = SymplecticUtil.getIssue(record);
    if (issue) {
        extra.issue = issue;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.JOURNAL_ARTICLE, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * An 'other' model
 */
var Other = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var pagination = SymplecticUtil.getPagination(record);
    if (pagination.pageBegin) {
        extra.pageBegin = pagination.pageBegin;
    }
    if (pagination.pageEnd) {
        extra.pageEnd = pagination.pageEnd;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.OTHER, source, date, authors, null, publicationStatus, extra);
};

/**
 * A 'report' model
 */
var Report = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'publisher');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var confidential = SymplecticUtil.getRecordField(record, 'confidential');
    if (confidential && confidential['api:boolean'] && confidential['api:boolean'][0] === 'true') {
        return null;
    }
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.REPORT, source, date, authors, publisher, publicationStatus, extra);
};

/**
 * A 'thesis' model
 */
var Thesis = function(entry) {
    var data = SymplecticUtil.getRecordData(entry);
    var record = data.preferredRecord;
    var sourceIds = data.sourceIds;

    var id = entry['$']['id'];
    var displayName = SymplecticUtil.getRecordFieldValue(record, 'title');
    var source = SymplecticUtil.getRecordSource(record);
    var date = SymplecticUtil.getDateValue(entry, record, 'publication-date');
    var authors = SymplecticUtil.getAuthors(record, 'authors');
    var publisher = SymplecticUtil.getRecordFieldValue(record, 'name-of-conference');
    var publicationStatus = SymplecticUtil.getRecordFieldValue(record, 'publication-status');

    var extra = {};
    var comments = SymplecticUtil.getRecordFieldValue(record, 'notes');
    if (comments) {
        extra.comments = comments;
    }
    var file = SymplecticUtil.getFile(record);
    if (file) {
        extra.file = file;
    }

    return new Publication(id, displayName, Constants.publicationTypes.THESIS, source, date, authors, publisher, publicationStatus, extra);
};
