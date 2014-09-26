module.exports.REST = require('./util.rest');

/**
 * Function that adds a leading zero to a given digit if necessary
 *
 * @param  {Number|String}  digit    The given digit
 * @return {String}                  The returned digit
 */
var addLeadingZero = module.exports.addLeadingZero = function(digit) {
    if (digit) {
        digit = parseInt(digit, 10);
        if (digit < 10) {
            digit = '0' + digit;
        }
        return String(digit);
    }
    return null;
};
