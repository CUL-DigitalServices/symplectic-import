var config = module.exports = {};

/**
 * `config.app`
 *
 * @param  {String}     host    The application host
 * @param  {Number}     port    The port where the server accepts connections
 */
config.app = {
    'host': 'localhost',
    'port': 2000,
};

/**
 * `config.symplectic`
 *
 * @param  {String}     uri                 The Symplectic publications endpoint
 * @param  {String}     endpoint            The Symplectic publications API URI
 * @param  {String}     items-per-page      The number of items per page
 */
config.symplectic = {
    'uri': 'https://ref.cam.ac.uk:8091',
    'endpoint': 'publications-api/v4.6/publications',
    'items-per-page': 25
};

/**
 * `config.zendesk`
 *
 * @param  {String}     username    The ZenDesk username
 * @param  {String}     token       The ZenDesk application token
 * @param  {String}     uri         The ZenDesk URI
 */
config.zendesk = {
    'username': 'oszkar@caret.cam.ac.uk',
    'token': 'vTznSUw6vtK397CTmPyot8YVPnfr6xnS5d9m4JS2',
    'uri': 'https://caret.zendesk.com/api/v2'
};
