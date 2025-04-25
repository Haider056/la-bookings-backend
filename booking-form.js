(function ($) {
    'use strict';

    // Initialize form when document is ready
    $(document).ready(function () {
        console.log('Booking form script initialized');

        // Hide all steps except the first one on page load
        $('.form-step').not('.step-1-content').removeClass('active');
        $('.step-1-content').addClass('active');

        // Set initial step in hidden input
        $('input[name="current_step"]').val(1);

        // Make sure progress bar shows first step as active
        $('.booking-progress-steps .step').removeClass('active');
        $('.booking-progress-steps .step-1').addClass('active');

        // Add validation error containers after each input
        $('input, select, textarea').each(function() {
            if (!$(this).next('.validation-error').length) {
                $(this).after('<div class="validation-error"></div>');
            }
        });

        // Add custom CSS for validation errors
        $('head').append('<style>' +
            '.validation-error { color: #d32f2f; font-size: 0.85em; margin-top: 4px; display: none; }' +
            '.form-field-error { border-color: #d32f2f !important; }' +
            '.notes-field { width: 100%; min-height: 100px; resize: vertical; }' +
            '</style>'
        );

        // Initialize date picker
        if ($.fn.datepicker) {
            $('.datepicker').datepicker({
                dateFormat: 'MM d, yy',
                minDate: 0,
                onSelect: function (date) {
                    $(this).data('selected-date', date);
                    $('input[name="available_date"]').val(date);
                }
            });
        } else {
            console.warn('jQuery UI Datepicker not available');
        }

        // Handle next button clicks
        $('.next-btn').on('click', function (e) {
            e.preventDefault();

            const $form = $(this).closest('form');
            const $formContainer = $(this).closest('.booking-form-container');
            const currentStepNum = parseInt($form.find('input[name="current_step"]').val());
            const nextStepNum = currentStepNum + 1;

            console.log('Moving from step', currentStepNum, 'to', nextStepNum);

            // Clear previous validation errors
            $('.validation-error').hide();
            $('input, select, textarea').removeClass('form-field-error');

            // Validation flag
            let isValid = true;

            // Basic validation
            if (currentStepNum === 1) {
                // Service selection validation
                const service1 = $form.find('input[name="service_option_1"], select[name="service_option_1"]').val();
                const service2 = $form.find('input[name="service_option_2"], select[name="service_option_2"]').val();

                if (!service1) {
                    showValidationError($form.find('input[name="service_option_1"], select[name="service_option_1"]'), 'Please select a service');
                    isValid = false;
                }
                if (!service2) {
                    showValidationError($form.find('input[name="service_option_2"], select[name="service_option_2"]'), 'Please select an option');
                    isValid = false;
                }
            } else if (currentStepNum === 2) {
                if ($form.find('input[name="booking_time"]').val() === '') {
                    showValidationError($form.find('.time-slots-container'), 'Please select a time slot');
                    isValid = false;
                }
            } else if (currentStepNum === 3) {
                // Customer information validation
                const fields = [
                    { selector: 'input[name="customer_name"]', message: 'Please enter your name' },
                    { selector: 'input[name="customer_phone"]', message: 'Please enter your phone number' },
                    { selector: 'input[name="customer_email"]', message: 'Please enter your email address' }
                ];

                fields.forEach(field => {
                    const $field = $form.find(field.selector);
                    if (!$field.val()) {
                        showValidationError($field, field.message);
                        isValid = false;
                    }
                });

                // Email validation
                const email = $form.find('input[name="customer_email"]').val();
                if (email && !validateEmail(email)) {
                    showValidationError($form.find('input[name="customer_email"]'), 'Please enter a valid email address');
                    isValid = false;
                }
            }

            // If validation fails, stop here
            if (!isValid) {
                return;
            }

            // Save form data
            saveFormData($form);

            // Hide current step
            $('.form-step').removeClass('active');

            // Show next step
            $('.step-' + nextStepNum + '-content').addClass('active');

            // Update progress bar
            updateProgress(nextStepNum, $formContainer);

            // Update hidden input
            $form.find('input[name="current_step"]').val(nextStepNum);

            // Special actions for certain steps
            if (currentStepNum === 1) {
                fetchTimeSlots($form);
            }
            if (currentStepNum === 3) {
                initStripeElements();
            }

            // Scroll to top of form
            $('html, body').animate({
                scrollTop: $form.offset().top - 50
            }, 500);
        });

        // Handle back button clicks
        $('.back-btn').on('click', function (e) {
            e.preventDefault();

            const $form = $(this).closest('form');
            const $formContainer = $(this).closest('.booking-form-container');
            const currentStepNum = parseInt($form.find('input[name="current_step"]').val());
            const prevStepNum = currentStepNum - 1;

            console.log('Moving back from step', currentStepNum, 'to', prevStepNum);

            // Prevent going back from first step
            if (currentStepNum <= 1) {
                return;
            }

            // Hide current step
            $('.form-step').removeClass('active');

            // Show previous step
            $('.step-' + prevStepNum + '-content').addClass('active');

            // Update progress bar
            updateProgress(prevStepNum, $formContainer);

            // Update hidden input
            $form.find('input[name="current_step"]').val(prevStepNum);

            // Scroll to top of form
            $('html, body').animate({
                scrollTop: $form.offset().top - 50
            }, 500);
        });

        // Handle time slot selection
        $(document).on('click', '.time-slot', function () {
            $('.time-slot').removeClass('selected');
            $(this).addClass('selected');

            // Store selected time and date
            const time = $(this).data('time');
            const date = $(this).data('date');

            console.log('Selected time slot:', time, 'on', date);

            $('input[name="booking_time"]').val(time);
            $('input[name="booking_date"]').val(date);

            // Enable next button
            $('.time-next-btn').prop('disabled', false);
        });

        // Handle form submission
        $('form.booking-form').on('submit', function (e) {
            e.preventDefault();
            const $form = $(this);
            const $formContainer = $form.closest('.booking-form-container');

            console.log('Form submission triggered');

            // Clear previous validation errors
            $('.validation-error').hide();
            $('input, select, textarea').removeClass('form-field-error');

            // Validation flag
            let isValid = true;

            // Validate payment details if Stripe is enabled
            if ($('#card-element').length && typeof Stripe !== 'undefined') {
                if (!$('#card-element iframe').length) {
                    showValidationError($('#card-element'), 'Please enter your payment details');
                    isValid = false;
                }
            }

            // If validation fails, stop here
            if (!isValid) {
                return;
            }

            // Get the date and properly format it 
            let bookingDate = $form.find('input[name="booking_date"]').val();

            // Convert date format if it's not empty
            if (bookingDate) {
                // Convert from "April 23, 2025" to "2025-04-23"
                const dateObj = new Date(bookingDate);
                if (!isNaN(dateObj.getTime())) {
                    // Valid date - format as YYYY-MM-DD
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    bookingDate = `${year}-${month}-${day}`;
                }
            }

            // Create a booking submission object with proper field mapping
            const bookingData = {
                customer_name: $form.find('input[name="customer_name"]').val(),
                customer_email: $form.find('input[name="customer_email"]').val(),
                customer_phone: $form.find('input[name="customer_phone"]').val(),
                service_name: $form.find('select[name="service_option_1"]').val() ||
                    $form.find('input[name="service_option_1"]').val(),
                service_details: $form.find('select[name="service_option_2"]').val() ||
                    $form.find('input[name="service_option_2"]').val(),
                booking_date: bookingDate, // Use the properly formatted date
                booking_time: $form.find('input[name="booking_time"]').val(),
                category_id: $form.find('input[name="category_id"]').val() || null,
                booking_notes: $form.find('textarea[name="booking_notes"]').val() || ''
            };

            // Debug - log form data contents before submission
            console.log('Form data being submitted:', bookingData);

            // Show loading indicator
            $('.submit-btn').prop('disabled', true).text('Processing...');

            // Define your local Express server URL for form submission
            const localExpressURL = 'https://e04722fcd91619.lhr.life/api/bookings';

            // Submit form to your local Express server
            $.ajax({
                url: localExpressURL,
                type: 'POST',
                data: JSON.stringify(bookingData),
                contentType: 'application/json',
                processData: false,
                success: function (response) {
                    console.log('Local server response:', response);

                    // Show success confirmation
                    // Update confirmation text with booking reference
                    $('.confirm-reference').text(response.booking_reference || 'BK-' + Math.floor(Math.random() * 10000));

                    // Update confirmation details with form data
                    $('.confirm-service-name').text(bookingData.service_name);
                    $('.confirm-datetime').text($form.find('input[name="booking_date"]').val() + ' at ' + bookingData.booking_time);
                    $('.confirm-staff-name').text('Staff');

                    // Send WordPress email notification
                    sendWordPressEmailNotification(bookingData, response.booking_reference);

                    // Move to confirmation step
                    $('.form-step').removeClass('active');
                    $('.step-5-content').addClass('active');

                    // Update progress bar
                    updateProgress(5, $formContainer);
                    $form.find('input[name="current_step"]').val(5);

                    // Scroll to top of form
                    $('html, body').animate({
                        scrollTop: $form.offset().top - 50
                    }, 500);
                },
                error: function (xhr, status, error) {
                    console.error('Error submitting to local server:', error);
                    console.error('Response status:', xhr.status);
                    console.error('Response text:', xhr.responseText);

                    // Re-enable submit button
                    $('.submit-btn').prop('disabled', false).text('Complete Booking');

                    // Show error message
                    alert('There was an error processing your booking. Please try again.');

                    // Fall back to original WordPress AJAX if local server fails
                    tryWordPressSubmission($form, new FormData($form[0]), $formContainer);
                }
            });
        });

        /**
         * Send email notification through WordPress
         */
        function sendWordPressEmailNotification(bookingData, bookingReference) {
            // Make AJAX call to WordPress to send an email
            $.ajax({
                url: booking_form_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'booking_form_send_email',
                    nonce: booking_form_ajax.nonce,
                    booking_data: bookingData,
                    booking_reference: bookingReference
                },
                success: function (response) {
                    console.log('Email notification sent:', response);
                },
                error: function (xhr, status, error) {
                    console.error('Error sending email notification:', error);
                }
            });
        }

        // Handle "Book Another" button
        $('.book-another-btn').on('click', function (e) {
            e.preventDefault();

            const $form = $(this).closest('form');
            const $formContainer = $form.closest('.booking-form-container');

            console.log('Resetting form');

            // Reset form
            $form[0].reset();

            // Clear hidden fields
            $form.find('input[name="booking_time"]').val('');
            $form.find('input[name="booking_date"]').val('');

            // Go back to first step
            $('.form-step').removeClass('active');
            $('.step-1-content').addClass('active');
            updateProgress(1, $formContainer);
            $form.find('input[name="current_step"]').val(1);

            // Scroll to top of form
            $('html, body').animate({
                scrollTop: $form.offset().top - 50
            }, 500);
        });

        // Function to show validation error
        function showValidationError($element, message) {
            const $error = $element.next('.validation-error');
            if ($error.length) {
                $error.text(message).show();
            } else {
                $('<div class="validation-error">' + message + '</div>').insertAfter($element).show();
            }
            $element.addClass('form-field-error');
        }

        // Style notes textarea to fix UI issues
        $('textarea[name="booking_notes"]').addClass('notes-field');
    });

    /**
     * Validate email format
     */
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    /**
     * Update progress indicators
     */
    function updateProgress(stepNum, $formContainer) {
        // Update progress steps
        $formContainer.find('.booking-progress-steps .step').removeClass('active');
        $formContainer.find('.booking-progress-steps .step-' + stepNum).addClass('active');
    }

    /**
     * Save form data to summary sections
     */
    function saveFormData($form) {
        // Get values
        let serviceName = '';
        const serviceField = $form.find('select[name="service_option_1"]');
        if (serviceField.length) {
            serviceName = serviceField.val();
        } else {
            serviceName = $form.find('input[name="service_option_1"]').val();
        }

        const staffName = 'Staff'; // Default if no staff selection
        const staffPrice = 20.00;  // Default price
        const bookingTime = $form.find('input[name="booking_time"]').val() || '';
        const bookingDate = $form.find('input[name="booking_date"]').val() || '';

        console.log('Updating summaries with:', serviceName, staffName, bookingTime, bookingDate);

        // Update in step 3
        $('.booking-summary .service-name').text(serviceName);
        $('.booking-summary .staff-name').text(staffName);
        $('.booking-summary .booking-time').text(bookingTime);
        $('.booking-summary .booking-date').text(bookingDate);
        $('.booking-summary .booking-price').text('$' + staffPrice.toFixed(2));

        // Update in time slots heading
        $('.time-slots-heading .service-name').text(serviceName);
        $('.time-slots-heading .staff-name').text(staffName);

        // Update in step 4
        $('.payment-summary .final-price').text(staffPrice.toFixed(2));

        // Update in step 5
        $('.confirmation-message .confirm-service-name').text(serviceName);
        $('.confirmation-message .confirm-datetime').text(bookingDate + ' at ' + bookingTime);
        $('.confirmation-message .confirm-staff-name').text(staffName);
    }

    /**
     * Fetch time slots via AJAX
     */
    function fetchTimeSlots($form) {
        const formId = $form.attr('id');
        const categoryId = $form.find('input[name="category_id"]').val();
        const date = $form.find('input[name="available_date"]').val() || '';
        const employeeId = $form.find('select[name="employee"]').val() || 1;

        // Get selected weekdays
        const availableDays = [];
        $form.find('input[name="available_days[]"]:checked').each(function () {
            availableDays.push($(this).val());
        });

        console.log('Fetching time slots for:', date, categoryId, employeeId, availableDays);

        // Update service and staff name in heading
        let serviceName = '';
        const serviceField = $form.find('select[name="service_option_1"]');
        if (serviceField.length) {
            serviceName = serviceField.val();
        } else {
            serviceName = $form.find('input[name="service_option_1"]').val();
        }

        $('.service-name').text(serviceName || 'Service');
        $('.staff-name').text('Staff');

        // Show loading indicator
        $('.time-slots-container').html('<div class="loading-spinner">Loading available time slots...</div>');

        // Define your local Express endpoint for time slots
        const localTimeSlotsURL = 'https://e04722fcd91619.lhr.life/api/timeslots';

        // Try first with local server
        $.ajax({
            url: localTimeSlotsURL,
            type: 'GET',
            data: {
                category: categoryId,
                date: date,
                employee: employeeId,
                available_days: availableDays.join(','),
                sort_by_date: 'true' // Add parameter to indicate we want date-based sorting
            },
            success: function (response) {
                console.log('Local server time slots response:', response);
                renderTimeSlots(response);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching time slots from local server:', error);
                console.log('Falling back to WordPress AJAX for time slots');

                // Fall back to WordPress AJAX
                $.ajax({
                    url: booking_form_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'booking_form_get_time_slots',
                        nonce: booking_form_ajax.nonce,
                        category: categoryId,
                        date: date,
                        employee: employeeId,
                        available_days: availableDays,
                        sort_by_date: 'true' // Add parameter to indicate we want date-based sorting
                    },
                    success: function (response) {
                        console.log('WordPress time slots response:', response);

                        if (response.success && response.data) {
                            renderTimeSlots(response.data);
                        } else {
                            $('.time-slots-container').html('<p>No available time slots found.</p>');
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Error fetching time slots:', error);
                        $('.time-slots-container').html('<p>Error loading time slots. Please try again.</p>');
                    }
                });
            }
        });
    }

    function renderTimeSlots(slotData) {
        const $container = $('.time-slots-container');
        $container.empty();

        // Check if we have any slots
        if (Object.keys(slotData).length === 0) {
            $container.html('<p>No available time slots found for the selected days.</p>');
            return;
        }

        // Convert data to an array for sorting by date number
        const datesArray = [];

        // Extract all date information from the slot data
        Object.keys(slotData).forEach(key => {
            const dayData = slotData[key];

            // Extract date information
            // Parse the date string like "April 23, 2024"
            const dateStr = dayData.full_date || '';
            const dateMatch = dateStr.match(/([A-Za-z]+)\s+(\d+),\s+(\d+)/);

            if (dateMatch) {
                const month = dateMatch[1];
                const day = parseInt(dateMatch[2], 10);
                const year = parseInt(dateMatch[3], 10);

                // Create Date object for proper sorting
                const monthIndex = {
                    "January": 0, "February": 1, "March": 2, "April": 3,
                    "May": 4, "June": 5, "July": 6, "August": 7,
                    "September": 8, "October": 9, "November": 10, "December": 11
                }[month];

                const dateObj = new Date(year, monthIndex, day);

                datesArray.push({
                    dateObj: dateObj,
                    day: day,
                    month: month,
                    monthAbbr: month.substring(0, 3),
                    year: year,
                    dayName: dayData.day_name || '',
                    data: dayData
                });
            }
        });

        // Sort by date number (not by day of week)
        // Sort by full date (not just day number)
        datesArray.sort((a, b) => a.dateObj - b.dateObj);

        console.log('Sorted dates array:', datesArray);

        // Build the calendar-style UI
        const $calendar = $('<div class="booking-calendar"></div>');

        // Create header row with date numbers in chronological order
        const $headerRow = $('<div class="calendar-header"></div>');

        // Add each date column in sorted order
        datesArray.forEach(dateInfo => {
            const $headerCell = $('<div class="calendar-header-cell">' +
                '<div class="day-name">' + dateInfo.dayName + '</div>' +
                '<div class="date-display">' + dateInfo.monthAbbr + ' ' + dateInfo.day + '</div>' +
                '</div>');
            $headerRow.append($headerCell);
        });

        $calendar.append($headerRow);

        // Find all available time slots across all dates
        const allAvailableTimeSlots = new Set();
        datesArray.forEach(dateInfo => {
            const dayData = dateInfo.data;
            if (dayData.times && Array.isArray(dayData.times)) {
                dayData.times.forEach(time => allAvailableTimeSlots.add(time));
            }
        });

        // Convert to array and sort chronologically
        const availableTimeSlots = Array.from(allAvailableTimeSlots).sort((a, b) => {
            const timeA = new Date(`1/1/2000 ${a}`);
            const timeB = new Date(`1/1/2000 ${b}`);
            return timeA - timeB;
        });

        // Create time slots rows - only for available times
        availableTimeSlots.forEach(timeSlot => {
            const $timeRow = $('<div class="calendar-row"></div>');

            // Create slot for each date
            datesArray.forEach(dateInfo => {
                const dayData = dateInfo.data;
                const isAvailable = dayData.times && dayData.times.includes(timeSlot);

                const $timeSlotCell = $('<div class="calendar-cell' + (isAvailable ? ' time-slot' : ' unavailable') + '" ' +
                    'data-time="' + timeSlot + '" ' +
                    'data-date="' + dayData.full_date + '">' +
                    timeSlot +
                    '</div>');

                $timeRow.append($timeSlotCell);
            });

            $calendar.append($timeRow);
        });

        // Add custom CSS
        const $css = $('<style>' +
            '.booking-calendar { display: grid; width: 100%; }' +
            '.calendar-header { display: grid; grid-template-columns: repeat(' + datesArray.length + ', 1fr); }' +
            '.calendar-row { display: grid; grid-template-columns: repeat(' + datesArray.length + ', 1fr); }' +
            '.calendar-header-cell { padding: 10px; text-align: center; font-weight: bold; }' +
            '.calendar-cell { padding: 15px; text-align: center; border: 1px solid #eee; margin: 5px; border-radius: 5px; }' +
            '.day-name { font-size: 14px; }' +
            '.date-display { font-size: 16px; font-weight: bold; }' +
            '.time-slot { background: #f9f9f9; cursor: pointer; }' +
            '.time-slot:hover { background: #f0f0f0; }' +
            '.time-slot.selected { background: #2196F3; color: white; }' +
            '.unavailable { opacity: 0.3; cursor: default; background: #eee; }' +
            '</style>');

        $container.append($css);
        $container.append($calendar);

        // Attach click handler to available time slots
        $container.find('.time-slot').on('click', function () {
            $('.time-slot').removeClass('selected');
            $(this).addClass('selected');

            // Store selected time and date
            const time = $(this).data('time');
            const date = $(this).data('date');

            console.log('Selected time slot:', time, 'on', date);

            $('input[name="booking_time"]').val(time);
            $('input[name="booking_date"]').val(date);

            // Enable next button
            $('.time-next-btn').prop('disabled', false);
        });
    }

    /**
     * Initialize Stripe Elements
     */
    function initStripeElements() {
        if (typeof Stripe === 'undefined') {
            console.warn('Stripe.js is not loaded');
            return;
        }

        // Skip if already initialized
        if (document.querySelector('#card-element iframe')) {
            return;
        }

        try {
            // Initialize Stripe
            const stripe = Stripe('pk_test_your_publishable_key_here');
            const elements = stripe.elements();

            // Create card element
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        color: '#32325d',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }
            });

            // Mount card element
            const cardElementContainer = document.getElementById('card-element');
            if (cardElementContainer) {
                cardElement.mount('#card-element');
            }
        } catch (error) {
            console.error('Error initializing Stripe:', error);
        }
    }
})(jQuery);