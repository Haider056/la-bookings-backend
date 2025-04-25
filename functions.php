/**
 * Enqueue booking form scripts and styles
 */
function enqueue_booking_form_assets() {
    // Enqueue jQuery UI for datepicker
    wp_enqueue_script('jquery-ui-datepicker');
    wp_enqueue_style('jquery-ui-css', 'https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css');
    
    // Enqueue custom booking form script and styles
    wp_enqueue_style('booking-form-css', get_template_directory_uri() . '/css/booking-form.css', array(), '1.0.0');
    wp_enqueue_script('booking-form-js', get_template_directory_uri() . '/js/booking-form.js', array('jquery', 'jquery-ui-datepicker'), '1.0.0', true);
    
    // Localize script with AJAX URL and nonce
    wp_localize_script('booking-form-js', 'booking_form_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('booking_form_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_booking_form_assets');

/**
 * Send booking notification email
 */
function booking_form_send_email_callback() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'booking_form_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }
    
    // Get booking data
    $booking_data = isset($_POST['booking_data']) ? $_POST['booking_data'] : array();
    $booking_reference = isset($_POST['booking_reference']) ? sanitize_text_field($_POST['booking_reference']) : '';
    
    if (empty($booking_data)) {
        wp_send_json_error('No booking data provided');
        return;
    }
    
    // Admin email
    $admin_email = get_option('admin_email');
    
    // Customer email
    $customer_email = isset($booking_data['customer_email']) ? sanitize_email($booking_data['customer_email']) : '';
    
    // Build email subject
    $subject = 'New Booking: ' . $booking_reference;
    
    // Build admin email content
    $admin_message = "A new booking has been made:\n\n";
    $admin_message .= "Booking Reference: " . $booking_reference . "\n";
    $admin_message .= "Customer: " . (isset($booking_data['customer_name']) ? sanitize_text_field($booking_data['customer_name']) : '') . "\n";
    $admin_message .= "Email: " . $customer_email . "\n";
    $admin_message .= "Phone: " . (isset($booking_data['customer_phone']) ? sanitize_text_field($booking_data['customer_phone']) : '') . "\n";
    $admin_message .= "Service: " . (isset($booking_data['service_name']) ? sanitize_text_field($booking_data['service_name']) : '') . "\n";
    $admin_message .= "Service Details: " . (isset($booking_data['service_details']) ? sanitize_text_field($booking_data['service_details']) : '') . "\n";
    $admin_message .= "Date: " . (isset($booking_data['booking_date']) ? sanitize_text_field($booking_data['booking_date']) : '') . "\n";
    $admin_message .= "Time: " . (isset($booking_data['booking_time']) ? sanitize_text_field($booking_data['booking_time']) : '') . "\n";
    $admin_message .= "Notes: " . (isset($booking_data['booking_notes']) ? sanitize_textarea_field($booking_data['booking_notes']) : '') . "\n";
    
    // Build customer email content with HTML
    $customer_subject = 'Your Booking Confirmation: ' . $booking_reference;
    
    // HTML email for customer
    $customer_message = '<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
            }
            .header {
                background-color: #ff6633;
                padding: 20px;
                text-align: center;
                color: white;
            }
            .content {
                padding: 20px;
                background-color: #f9f9f9;
            }
            .booking-details {
                background-color: white;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                padding: 15px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Booking Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear ' . (isset($booking_data['customer_name']) ? sanitize_text_field($booking_data['customer_name']) : 'Customer') . ',</p>
            <p>Thank you for your booking! Your reservation has been confirmed with the following details:</p>
            
            <div class="booking-details">
                <p><strong>Booking Reference:</strong> ' . $booking_reference . '</p>
                <p><strong>Service:</strong> ' . (isset($booking_data['service_name']) ? sanitize_text_field($booking_data['service_name']) : '') . '</p>
                <p><strong>Service Details:</strong> ' . (isset($booking_data['service_details']) ? sanitize_text_field($booking_data['service_details']) : '') . '</p>
                <p><strong>Date:</strong> ' . (isset($booking_data['booking_date']) ? sanitize_text_field($booking_data['booking_date']) : '') . '</p>
                <p><strong>Time:</strong> ' . (isset($booking_data['booking_time']) ? sanitize_text_field($booking_data['booking_time']) : '') . '</p>
            </div>
            
            <p>If you need to change or cancel your booking, please contact us.</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ' . date('Y') . ' ' . get_bloginfo('name') . '. All rights reserved.</p>
        </div>
    </body>
    </html>';
    
    // Email headers for HTML
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . get_bloginfo('name') . ' <' . $admin_email . '>',
        'Reply-To: ' . $admin_email
    );
    
    // Send admin email (plain text)
    $admin_headers = 'From: ' . $customer_email . "\r\n" .
                  'Reply-To: ' . $customer_email . "\r\n";
    $admin_sent = wp_mail($admin_email, $subject, $admin_message, $admin_headers);
    
    // Send customer email (HTML)
    $customer_sent = false;
    if (!empty($customer_email)) {
        $customer_sent = wp_mail($customer_email, $customer_subject, $customer_message, $headers);
    }
    
    // Log email attempt
    error_log('Sending booking emails - Admin: ' . ($admin_sent ? 'Success' : 'Failed') . ', Customer: ' . ($customer_sent ? 'Success' : 'Failed'));
    
    // Return result
    wp_send_json_success(array(
        'admin_email_sent' => $admin_sent,
        'customer_email_sent' => $customer_sent,
        'admin_email' => $admin_email,
        'customer_email' => $customer_email
    ));
}
add_action('wp_ajax_booking_form_send_email', 'booking_form_send_email_callback');
add_action('wp_ajax_nopriv_booking_form_send_email', 'booking_form_send_email_callback'); 