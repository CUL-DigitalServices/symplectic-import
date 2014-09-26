/**
 * A publication model
 *
 * @param  {String}                 displayName                     The title or display name for this publication
 * @param  {String}                 publicationType                 The format of the publication. (See `PublicationConstants.publicationTypes`)
 * @param  {Number}                 date                            The date when the publication was published
 * @param  {String[]}               authors                         A collection of authors
 * @param  {String}                 publisher                       Although the name is slightly ambiguous, this field is intended for Journal Names, Book publishers...
 * @param  {String}                 publicationStatus               The publication status
 * @param  {Object}                 [extra]                         Object containing extra values
 * @param  {String}                 [extra.openAccessType]          The open access type (e.g. green, gold)
 * @param  {Number}                 [extra.eissn]                   The eISSN
 * @param  {Number}                 [extra.issn]                    The ISSN
 * @param  {Number}                 [extra.issueNumber]             The issue number of the journal the article was published in
 * @param  {Number}                 [extra.pageBegin]               The page number of the magazine where the article starts
 * @param  {Number}                 [extra.pageEnd]                 The page number of the magazine where the article ends
 * @param  {String}                 [extra.comments]                Any additional comments on the entry
 * @param  {CorrespondingAuthor}    [extra.correspondingAuthor]     Object representing a corresponding author
 * @param  {String}                 [extra.file]                    The location of the file
 * @return {Publication}                                            Object representing the publication
 */
var Publication = module.exports.Publication = function(id, displayName, publicationType, source, date, authors, publisher, publicationStatus, extra) {
    var that = {};
    extra = extra || {};

    that.id = id;
    that.displayName = displayName;
    that.publicationType = publicationType;
    that.source = source;
    that.date = date;
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
    that.correspondingAuthor = extra.correspondingAuthor;
    that.authors = authors;
    that.file = extra.file;

    return that;
};
