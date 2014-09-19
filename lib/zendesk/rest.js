var SymplecticAPI = require('../search/api.symplectic/api');
var ZenDeskAPI = require('./api');

/**
 * Create a ZenDesk ticket for the specified publication
 *
 * @param  {Request}    req     The Express request object
 * @param  {Response}   res     The Express response object
 */
var createZenDeskTicket = module.exports.createZenDeskTicket = function(req, res) {

    // Fetch the publication id from the request body
    var id = req.body.id;

    // Fetch the publication
    var publication = SymplecticAPI.getPublication(id);

    // Create a ZenDesk ticket
    ZenDeskAPI.createZenDeskTickets(publication)

        .then(function() {
            return res.status(200).send('OK');
        })

        .fail(function() {
            return res.status(400).send('Error while creating ZenDesk ticket');
        });
};
