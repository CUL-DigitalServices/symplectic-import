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

        // Add event listeners
        addBinding();
    };

    /**
     * Function that shows the error message
     *
     * @param  {String}     err     Error message
     * @api private
     */
    var showError = function(err) {
        console.log(err);
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
            'timeout': 30000,
            'type': 'GET',
            'url': '/api/publications' + window.location.search
        };

        $.ajax(opts).done(showPublications).fail(function(err) {
            showError(err.statusText);
        });
    };

    /**
     * Function that triggers the creation of a ZenDesk ticket for the specified publication
     *
     * @param  {Event}  event   The triggered jQuery event
     * @api private
     */
    var createTicket = function(event) {

        var $button = $(event.currentTarget);

        // Change the button UI
        $button.addClass('disabled').find('i').removeClass('fa-ticket').addClass('fa-spinner').addClass('fa-spin');

        // Fetch the publicaiton id
        var id = $button.attr('data-value');

        // Request options object
        var opts = {
            'type': 'POST',
            'url': '/api/zendesk/ticket',
            'data': {
                'id': id
            }
        };

        $.ajax(opts)

            .done(function() {

                // Change the button UI
                $button.removeClass('btn-info').addClass('btn-success');
                $button.find('i').removeClass('fa-spinner').removeClass('fa-spin').addClass('fa-check');
            })

            .fail(function() {

                // Change the button UI
                $button.removeClass('btn-info').addClass('btn-danger');
                $button.find('i').removeClass('fa-spinner').removeClass('fa-spin').addClass('fa-exclamation');
            });
    };

    /**
     * Add event listeners to UI components
     */
    var addBinding = function() {

        // Create a ZenDesk ticket
        $('.js-symplectic-create-ticket').on('click', createTicket);
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
