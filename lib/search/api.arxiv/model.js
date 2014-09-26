var Publication = require('../model').Publication;

var ArxivUtil = require('./util');

/**
 * An Arxiv publication model
 */
var ArxivPublication = module.exports.ArxivPublication = function(entry) {

    var id = entry.id[0];
    var displayName = entry.title[0];
    var publicationType = null;
    var source = null;
    var date = entry.published[0];
    var authors = ArxivUtil.getAuthors(entry);
    var publisher = null;
    var publicationStatus = null;
    var extra = {};

    return new Publication(id, displayName, publicationType, source, date, authors, publisher, publicationStatus, extra);
};
