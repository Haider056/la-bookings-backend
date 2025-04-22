(function($) {
    'use strict';
    
    // Initialize form when document is ready
    $(document).ready(function() {
        console.log('Booking form script initialized');
        
        // Hide all steps except the first one on page load
        $('.form-step').not('.step-1-content').removeClass('active');
        $('.step-1-content').addClass('active');
        
        // Set initial step in hidden input
        $('input[name="current_step"]').val(1);
        
        // Make sure progress bar shows first step as active
        $('.booking-progress-steps .step').removeClass('active');
        $('.booking-progress-steps .step-1').addClass('active');
        
        // Initialize date picker
        if ($.fn.datepicker) {
            $('.datepicker').datepicker({
                dateFormat: 'MM d, yy',
                minDate: 0,
                onSelect: function(date) {
                    $(this).data('selected-date', date);
                    $('input[name="available_date"]').val(date);
                }
            });
        } else {
            console.warn('jQuery UI Datepicker not available');
        }
        
        // Handle next button clicks
        $('.next-btn').on('click', function(e) {
            e.preventDefault();
            
            const $form = $(this).closest('form');
            const $formContainer = $(this).closest('.booking-form-container');
            const currentStepNum = parseInt($form.find('input[name="current_step"]').val());
            const nextStepNum = currentStepNum + 1;
            
            console.log('Moving from step', currentStepNum, 'to', nextStepNum);
            
            // Basic validation
            if (currentStepNum === 1) {
                // Service selection validation
                const service1 = $form.find('input[name="service_option_1"], select[name="service_option_1"]').val();
                const service2 = $form.find('input[name="service_option_2"], select[name="service_option_2"]').val();
                
                if (!service1 || !service2) {
                    alert('Please complete all service fields');
                    return;
                }
            } else if (currentStepNum === 2) {
                if ($form.find('input[name="booking_time"]').val() === '') {
                    alert('Please select a time slot');
                    return;
                }
            } else if (currentStepNum === 3) {
                if (!$form.find('input[name="customer_name"]').val() || 
                    !$form.find('input[name="customer_email"]').val() || 
                    !$form.find('input[name="customer_phone"]').val()) {
                    alert('Please fill in all required fields');
                    return;
                }
                
                // Email validation
                const email = $form.find('input[name="customer_email"]').val();
                if (!validateEmail(email)) {
                    alert('Please enter a valid email address');
                    return;
                }
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
                if (typeof Stripe !== 'undefined') {
                    initStripeElements();
                }
            }
            
            // Scroll to top of form
            $('html, body').animate({
                scrollTop: $form.offset().top - 50
            }, 500);
        });
        
        // Handle back button clicks
        $('.back-btn').on('click', function(e) {
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
        $(document).on('click', '.time-slot', function() {
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
$('form.booking-form').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $formContainer = $form.closest('.booking-form-container');
    
    console.log('Form submission triggered');
    
    // Create a booking submission object with proper field mapping
    const bookingData = {
        customer_name: $form.find('input[name="customer_name"]').val(),
        customer_email: $form.find('input[name="customer_email"]').val(),
        customer_phone: $form.find('input[name="customer_phone"]').val(),
        service_name: $form.find('select[name="service_option_1"]').val() || 
                      $form.find('input[name="service_option_1"]').val(),
        service_details: $form.find('select[name="service_option_2"]').val() || 
                         $form.find('input[name="service_option_2"]').val(),
        booking_date: $form.find('input[name="booking_date"]').val(),
        booking_time: $form.find('input[name="booking_time"]').val(),
        category_id: $form.find('input[name="category_id"]').val() || null,
        booking_notes: $form.find('textarea[name="booking_notes"]').val() || ''
    };
    
    // Debug - log form data contents before submission
    console.log('Form data being submitted:', bookingData);
    
    // Show loading indicator
    $('.submit-btn').prop('disabled', true).text('Processing...');
    
    // Define your local Express server URL
    const localExpressURL = 'https://e709-182-191-130-115.ngrok-free.app/api/bookings';
    
    // Submit form to your local Express server
    $.ajax({
        url: localExpressURL,
        type: 'POST',
        data: JSON.stringify(bookingData),
        contentType: 'application/json',
        processData: false,
        success: function(response) {
            console.log('Local server response:', response);
            
            // Show success confirmation
            // Update confirmation text with booking reference
            $('.confirm-reference').text(response.booking_reference || 'BK-' + Math.floor(Math.random() * 10000));
            
            // Update confirmation details with form data
            $('.confirm-service-name').text(bookingData.service_name);
            $('.confirm-datetime').text(bookingData.booking_date + ' at ' + bookingData.booking_time);
            $('.confirm-staff-name').text('Staff');
            
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
        error: function(xhr, status, error) {
            console.error('Error submitting to local server:', error);
            console.error('Response status:', xhr.status);
            console.error('Response text:', xhr.responseText);
            
            // Fall back to original WordPress AJAX if local server fails
            tryWordPressSubmission($form, new FormData($form[0]), $formContainer);
        }
    });
});


        // Handle "Book Another" button
        $('.book-another-btn').on('click', function(e) {
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
    $form.find('input[name="available_days[]"]:checked').each(function() {
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
    const localTimeSlotsURL = 'https://e709-182-191-130-115.ngrok-free.app/api/timeslots';
    
    // Try first with local server
    $.ajax({
        url: localTimeSlotsURL,
        type: 'GET',
        data: {
            category: categoryId,
            date: date,
            employee: employeeId,
            available_days: availableDays.join(',')
        },
        success: function(response) {
            console.log('Local server time slots response:', response);
            renderTimeSlots(response);
        },
        error: function(xhr, status, error) {
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
                    available_days: availableDays
                },
                success: function(response) {
                    console.log('WordPress time slots response:', response);
                    
                    if (response.success && response.data) {
                        renderTimeSlots(response.data);
                    } else {
                        $('.time-slots-container').html('<p>No available time slots found.</p>');
                    }
                },
                error: function(xhr, status, error) {
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
        
        // Create tabs for each day
        const $tabContainer = $('<div class="time-slots-tabs"></div>');
        const $contentContainer = $('<div class="time-slots-content"></div>');
        
        let isFirstTab = true;
        
        // Create a tab and content panel for each day
        $.each(slotData, function(day, dayData) {
            // Create tab
            const $tab = $('<div class="time-tab" data-day="' + day + '">' + day + ' ' + dayData.date + '</div>');
            if (isFirstTab) {
                $tab.addClass('active');
            }
            $tabContainer.append($tab);
            
            // Create content panel
            const $content = $('<div class="time-content" id="times-' + day + '"></div>');
            if (isFirstTab) {
                $content.addClass('active');
            }
            
            // Add time slots
            if (dayData.times && dayData.times.length > 0) {
                $.each(dayData.times, function(i, time) {
                    const $slot = $('<div class="time-slot" data-time="' + time + '" data-date="' + dayData.full_date + '">' + time + '</div>');
                    $content.append($slot);
                });
            } else {
                $content.append('<p class="no-times">No available time slots for this day.</p>');
            }
            
            $contentContainer.append($content);
            isFirstTab = false;
        });
        
        // Add tabs and content to container
        $container.append($tabContainer);
        $container.append($contentContainer);
        
        // Tab click handler
        $tabContainer.on('click', '.time-tab', function() {
            const day = $(this).data('day');
            
            // Update active tab
            $tabContainer.find('.time-tab').removeClass('active');
            $(this).addClass('active');
            
            // Update active content
            $contentContainer.find('.time-content').removeClass('active');
            $contentContainer.find('#times-' + day).addClass('active');
        });
        
        // Disable next button until a time is selected
        $('.time-next-btn').prop('disabled', true);
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