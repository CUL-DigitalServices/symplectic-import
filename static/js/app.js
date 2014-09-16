$(function() {

    // Cache the rendered templates
    var tplPublications = null;
    var tplLoading = null;
    var tplError = null;

    /**
     * Function that shows the publications
     *
     * @param  {Publication[]}  publications    A collection of publications
     * @api private
     */
    var showPublications = function(publications) {
        renderTemplate(tplPublications, {'publications': publications});
    };

    /**
     * Function that shows the error message
     *
     * @param  {String}     err     Error message
     * @api private
     */
    var showError = function(err) {
        renderTemplate(tplError, {'err': err});
    };

    /**
     * Function that shows the loading message
     *
     * @api private
     */
    var showLoading = function() {
        renderTemplate(tplLoading);
    };

    /**
     * Function that puts the rendered template in its container
     *
     * @param  {Template}   template    Underscore template object
     * @param  {Object}     data        Object containing the template data
     * @api private
     */
    var renderTemplate = function(template, data) {
        $('#symplectic-publications-container').html(template(data));
    };

    /**
     * Function that preloads the templates
     */
    var loadTemplates = function() {
        tplPublications = _.template($('#symplectic-publications-template').html());
        tplLoading = _.template($('#symplectic-loading-template').html());
        tplError = _.template($('#symplectic-error-template').html());
    };

    /**
     * Function that requests the publications
     */
    var requestPublications = function() {

        // Render the template
        showLoading();

        var opts = {
            'timeout': 15000,
            'type': 'GET',
            'url': 'http://localhost:2000/api/publications' + window.location.search
        };

        $.ajax(opts).done(showPublications).fail(showError);
    };

    /**
     * Initializes the whole jibba jabba
     *
     * @api private
     */
    var init = function() {

        // Preload the templates
        loadTemplates();

        // Request the publications
        requestPublications();
    };

    init();
});
