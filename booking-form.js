(function ($) {
    'use strict';
    
    // Initialize form when document is ready
    $(document).ready(function () {
        const $form = $('.booking-form');
        const categoryId = $form.find('input[name="category_id"]').val();
        
        // Initialize form visibility based on category
        if (categoryId === '1') {
            // For pickup category, hide time slots step
            $('.step-2').hide();
        } else {
            // For other categories, show time slots step
            $('.step-2').show();
        }

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
       
        }
        
        // Handle next button clicks
        $('.next-btn').on('click', function (e) {
            e.preventDefault();
            
            const $form = $(this).closest('form');
            const $formContainer = $(this).closest('.booking-form-container');
            const currentStepNum = parseInt($form.find('input[name="current_step"]').val());
            const categoryId = $form.find('input[name="category_id"]').val();
            
            // For category 1, skip step 2 (time slots)
            let nextStepNum = currentStepNum + 1;
            if (categoryId === '1' && currentStepNum === 1) {
                nextStepNum = 3; // Skip to details step
            }

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

                // Additional validation for category 1
                if (categoryId === '1') {
                    const pickupDate = $form.find('input[name="pickup_date"]').val();
                    const pickupTime = $form.find('select[name="pickup_time"]').val();
                    
                    if (!pickupDate) {
                        showValidationError($form.find('input[name="pickup_date"]'), 'Please select a pickup date');
                        isValid = false;
                    }
                    if (!pickupTime) {
                        showValidationError($form.find('select[name="pickup_time"]'), 'Please select a pickup time');
                        isValid = false;
                    }
                } else {
                    // Validate availability fields for non-pickup categories
                    const availableDate = $form.find('input[name="available_date"]').val();
                    const startTime = $form.find('select[name="start_time"]').val();
                    const endTime = $form.find('select[name="end_time"]').val();
                    const availableDays = $form.find('input[name="available_days[]"]:checked').length;
                    
                    if (!availableDate) {
                        showValidationError($form.find('input[name="available_date"]'), 'Please select an available date');
                        isValid = false;
                    }
                    if (!startTime) {
                        showValidationError($form.find('select[name="start_time"]'), 'Please select a start time');
                        isValid = false;
                    }
                    if (!endTime) {
                        showValidationError($form.find('select[name="end_time"]'), 'Please select an end time');
                        isValid = false;
                    }
                    if (availableDays === 0) {
                        showValidationError($form.find('.weekdays'), 'Please select at least one available day');
                        isValid = false;
                    }
                }
            } else if (currentStepNum === 2 && categoryId !== '1') {
                // Only validate time slot selection for non-pickup categories
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
            if (currentStepNum === 1 && categoryId !== '1') {
                fetchTimeSlots($form);
            }
            if (nextStepNum === 3) {
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
            const categoryId = $('input[name="category_id"]').val();
            
            console.log('Selected time slot:', { time, date, categoryId });
            
            // Format time based on category
            let formattedTime = time;
            if (categoryId === '1') {
                // For pickup: Keep 12-hour format
                formattedTime = time;
                console.log('Using 12-hour format for pickup booking:', formattedTime);
            } else {
                // For non-pickup: Convert to 24-hour format
                const [timePart, period] = time.split(' ');
                let [hours, minutes] = timePart.split(':');
                hours = parseInt(hours);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                formattedTime = `${String(hours).padStart(2, '0')}:${minutes}`;
                console.log('Converted to 24-hour format for non-pickup booking:', formattedTime);
            }
            
            $('input[name="booking_time"]').val(formattedTime);
            $('input[name="booking_date"]').val(date);
            
            // Enable next button
            $('.time-next-btn').prop('disabled', false);
        });
        
     // Handle form submission
        $('form.booking-form').on('submit', function (e) {
    e.preventDefault();
    console.log('=== Form Submit Started ===');
    
    const $form = $(this);
    const $formContainer = $form.closest('.booking-form-container');
    const $submitBtn = $(document.activeElement); // Get the button that was clicked
    const paymentType = $submitBtn.data('payment') || 'now'; // Get payment type from button
    const categoryId = $form.find('input[name="category_id"]').val();
    
    console.log('Form found:', $form.length > 0);
    console.log('Submit button found:', $submitBtn.length > 0);
    console.log('Payment type:', paymentType);
    console.log('Category ID:', categoryId);

    // Disable all submit buttons to prevent double submission
    $('.submit-btn').prop('disabled', true).text('Processing...');

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

    // Validate required fields based on category
    if (categoryId === '1') {
        // For pickup category
        const pickupDate = $form.find('input[name="pickup_date"]').val();
        const pickupTime = $form.find('select[name="pickup_time"]').val();
        
        if (!pickupDate) {
            showValidationError($form.find('input[name="pickup_date"]'), 'Please select a pickup date');
            isValid = false;
        }
        if (!pickupTime) {
            showValidationError($form.find('select[name="pickup_time"]'), 'Please select a pickup time');
            isValid = false;
        }
    } else {
        // For non-pickup categories
        const bookingDate = $form.find('input[name="booking_date"]').val();
        const bookingTime = $form.find('input[name="booking_time"]').val();
        
        if (!bookingDate || !bookingTime) {
            alert('Please select a time slot for your booking.');
            isValid = false;
        }
    }

    console.log('Form validation passed:', isValid);

    // If validation fails, stop here
    if (!isValid) {
        console.log('Form validation failed, stopping submission');
        $submitBtn.prop('disabled', false).text(function() {
            return $(this).hasClass('pay-now') ? 'PAY NOW' : 'PAY LATER';
        });
        return;
    }

    // Create a booking submission object with proper field mapping
    const bookingData = {
        category_id: String(categoryId),
        category_name: $form.find('input[name="category_id"]').val() === '1' ? 'Book Private Pickups' : 'Other Service',
        service_name: $form.find('select[name="service_option_1"]').val() || $form.find('input[name="service_option_1"]').val() || '',
        service_details: $form.find('select[name="service_option_2"]').val() || $form.find('input[name="service_option_2"]').val() || '',
        service_option_1: $form.find('select[name="service_option_1"]').val() || $form.find('input[name="service_option_1"]').val() || '',
        service_option_2: $form.find('select[name="service_option_2"]').val() || $form.find('input[name="service_option_2"]').val() || '',
        employee_id: "1",
        employee_name: 'Staff',
        booking_date: '',
        booking_time: '',
        customer_name: $form.find('input[name="customer_name"]').val() || '',
        customer_phone: $form.find('input[name="customer_phone"]').val() || '',
        customer_email: $form.find('input[name="customer_email"]').val() || '',
        booking_notes: $form.find('textarea[name="booking_notes"]').val() || '',
        booking_reference: generateFallbackReference(),
        total_price: "20.00",
        status: "pending",
        payment_status: "pending",
        source: "wordpress",
        payment_type: paymentType // Add payment type based on button clicked
    };
    
    // Add date and time based on category
    if (categoryId === '1') {
        // For pickup category, use pickup date and time
        const pickupDate = $form.find('input[name="pickup_date"]').val();
        const pickupTime = $form.find('select[name="pickup_time"]').val();
        
        console.log('Pickup category - Date:', pickupDate, 'Time:', pickupTime);
        
        // Format date for database (YYYY-MM-DD)
        try {
            const dateObj = new Date(pickupDate);
            if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                bookingData.booking_date = `${year}-${month}-${day}`;
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        
        // Format time for database (HH:MM:SS)
        if (pickupTime) {
            // Convert 12-hour format to 24-hour format
            const [time, period] = pickupTime.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            bookingData.booking_time = `${String(hours).padStart(2, '0')}:${minutes}:00`;
        }
    } else {
        // For other categories, use selected booking date and time
        const selectedDate = $form.find('input[name="booking_date"]').val();
        const selectedTime = $form.find('input[name="booking_time"]').val();
        
        console.log('Other category - Selected Date:', selectedDate, 'Selected Time:', selectedTime);
        
        if (selectedDate) {
            try {
                const dateObj = new Date(selectedDate);
                if (!isNaN(dateObj.getTime())) {
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    bookingData.booking_date = `${year}-${month}-${day}`;
                }
            } catch (e) {
                console.error('Date parsing error:', e);
            }
        }
        
        if (selectedTime) {
            // For non-pickup, time is already in 24-hour format, just add seconds
            bookingData.booking_time = selectedTime + ':00';
        }
    }

    // Validate required fields before sending
    if (!bookingData.booking_date || !bookingData.booking_time) {
        console.error('Missing required date/time fields:', {
            booking_date: bookingData.booking_date,
            booking_time: bookingData.booking_time
        });
        alert('Please select a date and time for your booking.');
        $submitBtn.prop('disabled', false).text(function() {
            return $(this).hasClass('pay-now') ? 'PAY NOW' : 'PAY LATER';
        });
        return;
    }

    console.log('Final booking data:', bookingData);

    // Show loading indicator
    $submitBtn.prop('disabled', true).text('Processing...');
    
            // Define your local Express server URL for form submission
    const localExpressURL = 'https://e3dd26a8634495.lhr.life/api/bookings/wordpress';

    console.log('=== Making API Request ===');
    console.log('URL:', localExpressURL);
    console.log('Method:', 'POST');
    console.log('Data:', JSON.stringify(bookingData, null, 2));

            // Submit form to your local Express server
    $.ajax({
                url: localExpressURL,
        type: 'POST',
                data: JSON.stringify(bookingData),
                contentType: 'application/json',
        processData: false,
        beforeSend: function(xhr) {
            console.log('Request being sent...');
        },
                success: function (response) {
            console.log('=== Booking Success Response ===');
            console.log('Response:', response);

                    // Show success confirmation
                    $('.confirm-reference').text(response.booking_reference || bookingData.booking_reference);
            $('.confirm-service-name').text(bookingData.service_name);
                    $('.confirm-datetime').text(bookingData.booking_date + ' at ' + bookingData.booking_time);
                    $('.confirm-staff-name').text(bookingData.employee_name);

                    // Send WordPress email notification
                    sendWordPressEmailNotification(bookingData, response.booking_reference || bookingData.booking_reference);

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
            console.log('=== Booking Error Details ===');
            console.log('Status:', xhr.status);
            console.log('Status Text:', xhr.statusText);
            console.log('Error:', error);
            console.log('Response Text:', xhr.responseText);

                    // Re-enable submit button
            $submitBtn.prop('disabled', false).text(function() {
                return $(this).hasClass('pay-now') ? 'PAY NOW' : 'PAY LATER';
            });

                    // Handle slot already booked error
                    if (xhr.status === 409) {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            if (errorResponse.error === 'SLOT_ALREADY_BOOKED') {
                                alert('This time slot has just been booked by someone else. Please go back and select another time slot.');
                                
                                // Go back to time slot selection step
                                $('.form-step').removeClass('active');
                                $('.step-2-content').addClass('active');
                                updateProgress(2, $formContainer);
                                $form.find('input[name="current_step"]').val(2);
                                
                                // Refresh time slots
                                fetchTimeSlots($form);
                                return;
                            }
                        } catch (e) {
                    console.error('Error parsing error response:', e);
                }
            }

            // Show more specific error message based on status
            let errorMessage = 'There was an error processing your booking. ';
            if (xhr.status === 0) {
                errorMessage += 'Could not connect to the server. Please check your internet connection.';
            } else if (xhr.status === 400) {
                errorMessage += 'Please check all required fields are filled correctly.';
            } else if (xhr.status === 500) {
                errorMessage += 'Server error. Please try again later.';
            } else if (xhr.status === 404) {
                errorMessage += 'The booking service is currently unavailable.';
            }
            
            alert(errorMessage);
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
        
        // Get booking time and date based on category
        const categoryId = $form.find('input[name="category_id"]').val();
        let bookingTime, bookingDate;
        
        if (categoryId === '1') {
            bookingTime = $form.find('select[name="pickup_time"]').val();
            bookingDate = $form.find('input[name="pickup_date"]').val();
        } else {
            bookingTime = $form.find('input[name="booking_time"]').val();
            bookingDate = $form.find('input[name="booking_date"]').val();
        }
        
        // Update in step 3
        $('.booking-summary .service-name').text(serviceName);
        $('.booking-summary .staff-name').text(staffName);
        $('.booking-summary .booking-time').text(bookingTime);
        $('.booking-summary .booking-date').text(bookingDate);
        $('.booking-summary .booking-price').text('$' + staffPrice.toFixed(2));
        
        // Update in time slots heading (only for non-pickup categories)
        if (categoryId !== '1') {
            $('.time-slots-heading .service-name').text(serviceName);
            $('.time-slots-heading .staff-name').text(staffName);
        }
        
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
        const employeeId = $form.find('select[name="employee"]').val() || 1;
        
        // Get selected date from the form
        let selectedDate = $form.find('input[name="available_date"]').val() || '';
        
        // Parse and format the date properly for the API
        if (selectedDate) {
            try {
                // Convert from "April 23, 2025" to "2025-04-23"
                const dateObj = new Date(selectedDate);
                if (!isNaN(dateObj.getTime())) {
                    // Valid date - format as YYYY-MM-DD
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    selectedDate = `${year}-${month}-${day}`;
                }
            } catch (e) {
                // Just use the original string if parsing fails
            }
        }
        
        // Get selected weekdays
        const availableDays = [];
        $form.find('input[name="available_days[]"]:checked').each(function () {
            availableDays.push($(this).val());
        });
        
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
        const localTimeSlotsURL = 'https://e3dd26a8634495.lhr.life/api/timeslots';

        console.log('=== Fetching time slots ===');
        console.log('Category ID:', categoryId);
        console.log('Date:', selectedDate);
        console.log('Employee ID:', employeeId);
        console.log('Available days:', availableDays);
        
        const ajaxParams = {
            category: categoryId,
            date: selectedDate,
            employee: employeeId,
            available_days: availableDays.join(','),
            sort_by_date: 'true'
        };
        
        console.log('API URL:', localTimeSlotsURL);
        console.log('API params:', ajaxParams);

        // Try first with local server
        $.ajax({
            url: localTimeSlotsURL,
            type: 'GET',
            data: ajaxParams,
            success: function (response) {
                console.log('=== Time slots API response ===');
                console.log(response);
                renderTimeSlots(response);
            },
            error: function (xhr, status, error) {
                console.error('Error fetching time slots from API:', error);
                console.error('Status:', status);
                console.error('Response:', xhr.responseText);
                
                // Fall back to WordPress AJAX
                $.ajax({
                    url: booking_form_ajax.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'booking_form_get_time_slots',
                        nonce: booking_form_ajax.nonce,
                        category: categoryId,
                        date: selectedDate,
                        employee: employeeId,
                        available_days: availableDays,
                        sort_by_date: 'true'
                    },
                    success: function (response) {
                        if (response.success && response.data) {
                            renderTimeSlots(response.data);
                        } else {
                            $('.time-slots-container').html('<p>No available time slots found.</p>');
                        }
                    },
                    error: function (xhr, status, error) {
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
    
        }
    }

    /**
     * Generate a fallback booking reference
     */
    function generateFallbackReference() {
        // Generate three random letters (A-Z)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let alphabetPart = '';
        for (let i = 0; i < 3; i++) {
            alphabetPart += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // Generate three random numbers (100-999)
        const numericPart = Math.floor(Math.random() * 900 + 100);
        
        // Return in the format ABC-123
        return alphabetPart + '-' + numericPart;
    }
})(jQuery);