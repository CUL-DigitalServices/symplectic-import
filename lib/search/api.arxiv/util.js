var _ = require('underscore');
var util = require('util');

var AppUtil = require('../../util/util');

/**
 * Returns the authors per entry
 *
 * @param  {Object}     entry   Object containing entry data
 */
var getAuthors = module.exports.getAuthors = function(entry) {
    return _.map(entry.author, function(author) {
        return author.name;
    })
};

/**
 * Returns the current date in the ArXiv accepted format
 *
 * @return  {String}    The current date in the ArXiv accepted format
 */
var getCurrentDate = module.exports.getCurrentDate = function() {

    var date = new Date();

    var year = date.getFullYear().toString();
    var month = AppUtil.addLeadingZero((date.getMonth()+1).toString());
    var day  = AppUtil.addLeadingZero(date.getDate().toString());

    return util.format('%s%s%s0000', year, month, day);
};
