var q = require('q');
var xml2js = require('xml2js');

/**
 * Takes a string and parses it as XML
 *
 * * deferred.reject    {String}    Error message
 * * deferred.resolve   {Object}    Object containing the XML data
 *
 * @param  {String}     str     The string to parse
 * @return {Promise}
 */
var parseXml = module.exports.parseXml = function(str) {
    var deferred = q.defer();
    setTimeout(function() {
        try {
            var parser = new xml2js.Parser({'explicitArray': true});
            parser.parseString(str, function(err, xml) {
                if (err) {
                    return deferred.reject('Could not parse XML');
                }

                return deferred.resolve(xml);
            });
        } catch(err) {
            return deferred.reject('Could not parse XML');
        }
    }, 100);
    return deferred.promise;
};

/**
 * Plucks the ArXiv ID from a string
 *
 *  * Examples:
 *  * - http://arxiv.org/abs/math/0611788v2
 *  * - http://arxiv.org/abs/1109.0505v3
 *
 * @param  {String}     string      The string containing the ArXiv ID
 * @return {String}                 The ArXiv ID
 */
var getArxivIdFromString = module.exports.getArxivIdFromString = function(string) {
    var match = string.match(/([0-9]{4}\.[0-9]{4}|[0-9]{7})/g);
    if (match) {
        return match[0];
    }
    return null;
};
