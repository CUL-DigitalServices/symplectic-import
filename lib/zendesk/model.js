/**
 * A ZenDesk ticket
 *
 * @param  {String}         subject             The subject of the ticket
 * @param  {String}         comment             The comment of the ticket
 * @param  {Object[]}       custom_fields       The ticket's custom fields
 * @return {ZenDeskTicket}                      Object representing a ZenDesk ticket
 */
var ZenDeskTicket = module.exports.ZenDeskTicket = function(subject, comment, custom_fields) {
    var that = {};
    that.ticket = {
        'subject': subject,
        'comment': comment,
        'custom_fields': custom_fields
    };
    return that;
};
