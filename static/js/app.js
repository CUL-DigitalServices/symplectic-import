$(function() {

    // Cache the socket connection
    var socket = null;

    // Cache the rendered templates
    var tplPublications = null;
    var tplLoading = null;
    var tplError = null;

    /**
     * Function that shows the publications
     *
     * @param  {Object}     results     Object containing the results per api
     * @api private
     */
    var showPublications = function(results) {

        // Render the publications template
        renderTemplate(tplPublications, {'results': results});

        // Add a click handler to the ZenDesk button
        $('.js-symplectic-create-ticket').on('click', createTicket);
    };

    /**
     * Function that displays the progress
     *
     * @param  {Object}     progress    Object containing the progress information
     * @api private
     */
    var progressHandler = function(progress) {
        var $loading = $('#symplectic-loading');
        var $caption = $($loading).find('.caption');
        var api = _.keys(progress)[0];
        $($caption).html('Fetching publications from <strong class="api">' + api + '</strong> (' + progress[api]['current'] + '/' + progress[api]['total'] + ')');
    };

    /**
     * Function that displays the loading
     *
     * @api private
     */
    var showLoading = function() {
        renderTemplate(tplLoading);
        var $loading = $('#symplectic-loading');
        var $caption = $($loading).find('.caption');
        $($caption).html('Fetching publications...');
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
     *
     * @param  {Event}  event   The triggered jQuery event
     * @api private
     */
    var requestPublications = function(event) {

        // Prevent the form from being submitted
        event.preventDefault();

        // Render the template
        showLoading();

        // Create a message object
        var opts = {
            'author-ids': $('#js-symplectic-publications-form-author-ids').val(),
            'created-since': $('#js-symplectic-publications-form-created-since').val(),
            'groups': $('#js-symplectic-publications-form-groups').val()
        }

        // Send a socket message
        socketConnection.emit('PUB_GET_PUBLICATIONS', opts);
    };

    /**
     * Change the dropdown value
     *
     * @param  {Event}  event   The triggered jQuery event
     * @api private
     */
    var onDropDownChange = function(event) {
        event.preventDefault();

        var group = $(event.currentTarget).attr('data-group');
        var label = $(event.currentTarget).text();

        $('#js-symplectic-publications-form-groups').val(group);
        $('#js-symplectic-publications-form-label').text(label);
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
     * Add event listeners to UI components=
     */
    var addBinding = function() {

        // Create a ZenDesk ticket
        $('.js-symplectic-create-ticket').on('click', createTicket);

        // Fetch the publications
        $('#js-symplectic-publications-form').on('submit', requestPublications);

        // On dropdown change
        $('#js-symplectic-publications-form-groups-dropdown').find('li a').on('click', onDropDownChange);
    };

    /**
     * Set up a connection with the socket server
     */
    var initSockets = function() {

        // Connect with the socket server
        socketConnection = io.connect(window.location.host);

        // Listen to default socket events
        socketConnection.on('disconnect', showError);

        // Listen to custom events
        socketConnection.on('PUB_ERROR', showError);
        socketConnection.on('PUB_GET_PUBLICATIONS', showPublications);
        socketConnection.on('PUB_GET_PUBLICATIONS_PROGRESS', progressHandler);
    };

    /**
     * Initializes the whole jibba jabba
     *
     * @api private
     */
    var init = function() {

        // Connect with the socket server
        initSockets();

        // Bind event listeners to UI components
        addBinding();

        // Preload the templates
        loadTemplates();
    };

    init();
});
