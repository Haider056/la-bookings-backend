/**
 * Custom Booking Form
 * 
 * Creates a multi-step booking form that can be added to pages via shortcode.
 * Usage: [custom_booking_form id="1"]
 * Where id corresponds to a category (1=Pickups, 2=Spa, etc.)
 */

// Don't allow direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get category mapping data
 */
// Use cookies instead of sessions to avoid header issues
function start_booking_form_session() {
    // We'll use WordPress transients instead of PHP sessions
    // No need to call session_start() which can cause header issues
}
add_action('init', 'start_booking_form_session', 1); // Priority 1 to run early

function get_category_mapping() {
    return array(
        1 => array(
            'name' => 'Book Private Pickups',
            'service_label_1' => 'Pickup From',
            'service_field_1' => 'text',
            'service_label_2' => 'Drop Off At',
            'service_field_2' => 'text',
        ),
        2 => array(
            'name' => 'Book Spa/Salon/Barber',
            'service_label_1' => 'Service',
            'service_field_1' => 'dropdown',
            'service_options_1' => array('Haircut', 'Salon', 'Spa', 'Choose later'),
            'service_label_2' => 'Choose Stylist',
            'service_field_2' => 'dropdown',
            'service_options_2' => array('Choose later'),
        ),
        3 => array(
            'name' => 'Find Hotel/Accommodation',
            'service_label_1' => 'Options',
            'service_field_1' => 'dropdown',
            'service_options_1' => array('Hotel Room', 'Apartment', 'House'),
            'service_label_2' => 'Area or City',
            'service_field_2' => 'text',
        ),
        4 => array(
            'name' => 'Find Flight Tickets',
            'service_label_1' => 'Flight From',
            'service_field_1' => 'text',
            'service_label_2' => 'Flight To',
            'service_field_2' => 'text',
        ),
        5 => array(
            'name' => 'Find Car/Truck Rental',
            'service_label_1' => 'Options',
            'service_field_1' => 'dropdown',
            'service_options_1' => array('Small Car', 'SUV', 'Truck', 'Tour Bus', 'Other'),
            'service_label_2' => 'Area or City',
            'service_field_2' => 'text',
        ),
        6 => array(
            'name' => 'Find Events and Tickets',
            'service_label_1' => 'Event Type / Description',
            'service_field_1' => 'text',
            'service_label_2' => 'Area or City',
            'service_field_2' => 'text',
        ),
        7 => array(
            'name' => 'Help Me Find Something Else',
            'service_label_1' => 'Description',
            'service_field_1' => 'text',
            'service_label_2' => 'Area or City',
            'service_field_2' => 'text',
        ),
    );
}

/**
 * Generate employee/staff options
 */
function get_employee_options() {
    // In a real scenario, you might fetch this from the database
    return array(
        array('id' => 1, 'name' => 'Staff', 'price' => 20.00),
        array('id' => 2, 'name' => 'Senior Staff', 'price' => 30.00),
        array('id' => 3, 'name' => 'Expert', 'price' => 40.00),
    );
}

/**
 * Create form shortcode
 */
function custom_booking_form_shortcode($atts) {
    // Extract attributes
    $atts = shortcode_atts(array(
        'id' => '1', // Default to first category
        'price' => '20.00', // Default price
        'currency' => 'USD', // Default currency
    ), $atts, 'custom_booking_form');
    
    // Get category mapping
    $categories = get_category_mapping();
    $category_id = intval($atts['id']);
    
    // Check if category exists
    if (!isset($categories[$category_id])) {
        return '<p>Invalid category ID.</p>';
    }
    
    $category = $categories[$category_id];
    $employee_options = get_employee_options();
    
  
    
    // Use a unique identifier for this form instance
    $form_unique_id = 'booking_form_' . $category_id . '_' . uniqid();
    // We'll store form data in a transient if needed
    // set_transient('booking_form_data_' . $form_unique_id, array(), 60*60); // 1 hour expiration
    
    // Generate a unique form ID for this instance
    $form_id = 'booking_form_' . $category_id . '_' . uniqid();
    
    // Start output buffer to capture form HTML
    ob_start();
    
    // Main form container
    echo '<div class="booking-form-container" data-form-id="' . esc_attr($form_id) . '" data-category="' . esc_attr($category_id) . '">';
    
    // Progress steps
    echo '<div class="booking-progress-steps">';
    echo '<div class="step step-1 active"><span class="step-number">1</span> Service</div>';
    echo '<div class="step step-2"><span class="step-number">2</span> Time</div>';
    echo '<div class="step step-3"><span class="step-number">3</span> Details</div>';
    echo '<div class="step step-4"><span class="step-number">4</span> Payment</div>';
    echo '<div class="step step-5"><span class="step-number">5</span> Done</div>';
    echo '</div>';
  
    
    // Form
    echo '<form id="' . esc_attr($form_id) . '" class="booking-form" method="post">';
    
    // Hidden fields for form tracking
    echo '<input type="hidden" name="form_id" value="' . esc_attr($form_id) . '">';
    echo '<input type="hidden" name="category_id" value="' . esc_attr($category_id) . '">';
    echo '<input type="hidden" name="current_step" value="1">';
    echo '<input type="hidden" name="booking_time" value="">';
    echo '<input type="hidden" name="booking_date" value="">';
    echo wp_nonce_field('booking_form_submission', 'booking_form_nonce', true, false);
// Step 1: Service selection
echo '<div class="form-step step-1-content active">';

// Category name (15px)
echo '<h5 style="font-size: 15px; margin: 20px 0;">' . esc_html($category['name']) . '</h5>';


echo '<div class="form-row"></div>';

echo '<div class="form-row three-column">';

// Service column 1
echo '<div class="form-group">';
echo '<label style="font-size: 13px;">' . esc_html($category['service_label_1']) . '</label>';
echo '<div class="select-wrapper">';
if ($category['service_field_1'] === 'dropdown' && isset($category['service_options_1'])) {
    echo '<select name="service_option_1" style="font-size: 13px;">';
    foreach ($category['service_options_1'] as $option) {
        echo '<option value="' . esc_attr($option) . '">' . esc_html($option) . '</option>';
    }
    echo '</select>';
} else {
    echo '<input type="text" name="service_option_1" placeholder="Enter ' . esc_attr($category['service_label_1']) . '" style="font-size: 13px;">';
}
echo '</div>';
echo '</div>';

// Service column 2
echo '<div class="form-group">';
echo '<label style="font-size: 13px;">' . esc_html($category['service_label_2']) . '</label>';
echo '<div class="select-wrapper">';
if ($category['service_field_2'] === 'dropdown' && isset($category['service_options_2'])) {
    echo '<select name="service_option_2" style="font-size: 13px;">';
    foreach ($category['service_options_2'] as $option) {
        echo '<option value="' . esc_attr($option) . '">' . esc_html($option) . '</option>';
    }
    echo '</select>';
} else {
    echo '<input type="text" name="service_option_2" placeholder="Enter ' . esc_attr($category['service_label_2']) . '" style="font-size: 13px;">';
}
echo '</div>';
echo '</div>';

// Employee selection
echo '<div class="form-group">';
echo '<div class="select-wrapper" style="font-size: 13px;">';
echo '</div>';
echo '</div>';

echo '</div>';
 // End three-column
    

echo '<div class="form-row availability-time-row" style="font-size: 12px;">'; // Overall font size
echo '<div class="form-group availability-date">';
echo '<label style="font-size: 12px;">I\'m available on or after</label>';
echo '<input style="font-size: 12px; background-color:white" type="text" name="available_date" class="datepicker" value="' . esc_attr(date('F j, Y')) . '">';
echo '</div>';

echo '<div class="form-group weekdays" style="font-size: 6px;">';
$days = array('Mon', 'Tue', 'Wed', 'Thu', 'Fri');
foreach ($days as $day) {
    echo '<label class="weekday-checkbox" style="font-size: 7px; display: block; margin-top: 10px;">'; // Reduced font size and increased top margin
    echo '<input type="checkbox" name="available_days[]" value="' . esc_attr($day) . '" checked>';
    echo '<span class="checkmark" style="font-size: 10px;">' . esc_html($day) . '</span>'; // Smaller font size
    echo '</label>';
}
echo '</div>';

echo '<div class="form-group">';
echo '<label style="font-size: 12px;">Start from</label>';
echo '<div class="select-wrapper">';
echo '<select style="font-size: 12px;" name="start_time">';
for ($hour = 8; $hour <= 17; $hour++) {
    $time_str = sprintf('%02d:00 %s', $hour > 12 ? $hour - 12 : $hour, $hour >= 12 ? 'pm' : 'am');
    echo '<option value="' . esc_attr($time_str) . '">' . esc_html($time_str) . '</option>';
}
echo '</select>';
echo '</div>';
echo '</div>';

echo '<div class="form-group">';
echo '<label style="font-size: 12px;">Finish by</label>';
echo '<div class="select-wrapper" style="font-size: 12px;">';
echo '<select name="end_time">';
for ($hour = 9; $hour <= 18; $hour++) {
    $time_str = sprintf('%02d:00 %s', $hour > 12 ? $hour - 12 : $hour, $hour >= 12 ? 'pm' : 'am');
    echo '<option value="' . esc_attr($time_str) . '"' . ($hour == 18 ? ' selected' : '') . '>' . esc_html($time_str) . '</option>';
}
echo '</select>';
echo '</div>';
echo '</div>';

echo '</div>';
 // End availability-time-row
	
 
    
    echo '<div class="form-navigation">';
    echo '<button type="button" class="next-btn">NEXT</button>';
    echo '</div>';
    
    echo '</div>'; // End step 1
    
    // Step 2: Time selection
    echo '<div class="form-step step-2-content">';
    echo '<div class="time-slots-heading">';
    echo '<p>Below you can find a list of available time slots for <span class="service-name">Service</span> by <span class="staff-name">Staff</span>.</p>';
    echo '<p>Click on a time slot to proceed with booking.</p>';
    echo '</div>';
    
    echo '<div class="time-slots-container">';
    // Time slots will be dynamically populated with JavaScript
    echo '</div>';
    
    echo '<div class="form-navigation">';
    echo '<button type="button" class="back-btn">BACK</button>';
    echo '<button type="button" class="next-btn time-next-btn">&gt;</button>';
    echo '</div>';
    
    echo '</div>'; // End step 2
    
    // Step 3: Customer details
    echo '<div class="form-step step-3-content">';
    echo '<div class="booking-summary">';
    echo '<p>You selected a booking for <span class="service-name">Service</span> by <span class="staff-name">Staff</span> at <span class="booking-time">3:30 pm</span> on <span class="booking-date">March 31, 2025</span>. The price for the service is <span class="booking-price">$' . esc_html($atts['price']) . '</span>.</p>';
    echo '<p>Please provide your details in the form below to proceed with booking.</p>';
    echo '</div>';
    
    echo '<div class="form-row three-column">';
    echo '<div class="form-group">';
    echo '<label>Full name</label>';
    echo '<input type="text" name="customer_name" required>';
    echo '</div>';
    
    echo '<div class="form-group">';
    echo '<label>Phone</label>';
    echo '<div class="phone-input-group">';
    echo '<input type="tel" name="customer_phone" required>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="form-group">';
    echo '<label>Email</label>';
    echo '<input type="email" name="customer_email" required>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="form-row">';
    echo '<div class="form-group full-width">';
    echo '<label>Notes</label>';
    echo '<textarea name="booking_notes" rows="4"></textarea>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="form-navigation">';
    echo '<button type="button" class="back-btn">BACK</button>';
    echo '<button type="button" class="next-btn">NEXT</button>';
    echo '</div>';
    
    echo '</div>'; // End step 3
    
    // Step 4: Payment
    echo '<div class="form-step step-4-content">';
    echo '<div class="payment-container">';
    echo '<h3>Payment Details</h3>';
    
    echo '<div class="stripe-element-container">';
    echo '<div id="card-element"><!-- Stripe Elements Placeholder --></div>';
    echo '<div id="card-errors" role="alert"></div>';
    echo '</div>';
    
    echo '<div class="payment-summary">';
    echo '<p>Total to pay: $<span class="final-price">' . esc_html($atts['price']) . '</span></p>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="form-navigation">';
    echo '<button type="button" class="back-btn">BACK</button>';
    echo '<button type="submit" class="submit-btn">PAY NOW</button>';
    echo '</div>';
    
    echo '</div>'; // End step 4
    
    // Step 5: Confirmation (will be shown after successful submission)
    echo '<div class="form-step step-5-content">';
    echo '<div class="confirmation-message">';
    echo '<h3>Booking Confirmed!</h3>';
    echo '<p>Thank you for your booking. A confirmation has been sent to your email.</p>';
    echo '<div class="booking-details">';
    echo '<p><strong>Service:</strong> <span class="confirm-service-name">Service</span></p>';
    echo '<p><strong>Date & Time:</strong> <span class="confirm-datetime">March 31, 2025 at 3:30 pm</span></p>';
    echo '<p><strong>Staff:</strong> <span class="confirm-staff-name">Staff</span></p>';
    echo '<p><strong>Booking Reference:</strong> <span class="confirm-reference">BK12345</span></p>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="form-navigation">';
    echo '<a href="#" class="book-another-btn">Book Another Service</a>';
    echo '</div>';
    
    echo '</div>'; // End step 5
    
    echo '</form>';
    echo '</div>'; // End form container
    
    // Return the form HTML
    return ob_get_clean();
}
add_shortcode('custom_booking_form', 'custom_booking_form_shortcode');


function booking_form_get_time_slots() {
    global $wpdb;
    
    // Check nonce for security
    check_ajax_referer('booking_form_submission', 'nonce');
    
    // Get parameters with defaults
    $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : date('F j, Y');
    $service = isset($_POST['service']) ? sanitize_text_field($_POST['service']) : '';
    $employee_id = isset($_POST['employee']) && intval($_POST['employee']) > 0 
                 ? intval($_POST['employee']) 
                 : 1; // Default to employee ID 1 if not set or invalid
    $category_id = isset($_POST['category']) ? intval($_POST['category']) : 1;
    $available_days = isset($_POST['available_days']) ? (array)$_POST['available_days'] : array('Mon', 'Tue', 'Wed', 'Thu', 'Fri');
    
    // Convert date to standard format
    $base_date = date('Y-m-d', strtotime($date));
    
    // Use standard approach to table naming
    $bookings_table = $wpdb->prefix . 'custom_booking_submissions';
    
    // Make sure the table exists
    if (function_exists('ensure_booking_table_exists')) {
        ensure_booking_table_exists();
    } else {
        // Fallback table creation
        $charset_collate = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE IF NOT EXISTS {$bookings_table} (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            category_id tinyint(2) NOT NULL,
            category_name varchar(100) NOT NULL,
            service_option_1 varchar(255) NOT NULL,
            service_option_2 varchar(255) NOT NULL,
            employee_id tinyint(2) NOT NULL,
            employee_name varchar(100) NOT NULL,
            booking_date date NOT NULL,
            booking_time time NOT NULL,
            customer_name varchar(100) NOT NULL,
            customer_phone varchar(20) NOT NULL,
            customer_email varchar(100) NOT NULL,
            booking_notes text,
            booking_reference varchar(20) NOT NULL,
            total_price decimal(10,2) NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) {$charset_collate};";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        error_log("Booking table created from booking-form.php");
    }
    
    // Log the table name we're using
    error_log("Using booking table: " . $bookings_table);
    
    // Array to store the result
    $slots = array();
    
    // Get available days based on date
    for ($day_index = 0; $day_index < 7; $day_index++) {
        $current_date = date('Y-m-d', strtotime("+$day_index days", strtotime($base_date)));
        $day_name = date('D', strtotime($current_date));
        
        // Skip days not selected by user
        if (!in_array(substr($day_name, 0, 3), $available_days)) {
            continue;
        }
        
        $formatted_date = date('M d', strtotime($current_date));
        $slots[$day_name] = array(
            'date' => $formatted_date,
            'full_date' => date('F j, Y', strtotime($current_date)),
            'times' => array()
        );
        
        // Generate time slots based on business hours
        // For example, from 8 AM to 6 PM at 30-minute intervals
        // Generate time slots based on business hours
        // Generate time slots based on business hours
for ($hour = 8; $hour < 18; $hour++) {
    $min = 0;  // Only need top of the hour
    $time_slot = sprintf(
        '%d:%02d %s',
        $hour > 12 ? $hour - 12 : ($hour == 0 ? 12 : $hour),
        $min,
        $hour >= 12 ? 'pm' : 'am'
    );
    
    // Convert to database format for checking
    $time_value = sprintf('%02d:%02d:00', $hour, $min);
    
    // Check if this slot is already booked
    $booked = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $bookings_table 
         WHERE booking_date = %s 
         AND booking_time = %s
         AND employee_id = %d",
        $current_date, $time_value, $employee_id
    ));
    
    // Debug log
    error_log("Checking slot: $current_date $time_value for employee $employee_id - Booked: $booked");
    
    // If not booked, add to available slots
    if ($booked == 0) {
        $slots[$day_name]['times'][] = $time_slot;
    }
}
    }
    $sql = $wpdb->prepare(
        "SELECT COUNT(*) FROM $bookings_table 
         WHERE booking_date = %s 
         AND booking_time = %s
         AND employee_id = %d",
        $current_date, $time_value, $employee_id
    );
    error_log("SQL Query: " . $sql);
    
    // After generating slots, log what's being returned
    error_log("Returning slots: " . print_r($slots, true));
    wp_send_json_success($slots);
}



add_action('wp_ajax_booking_form_get_time_slots', 'booking_form_get_time_slots');
add_action('wp_ajax_nopriv_booking_form_get_time_slots', 'booking_form_get_time_slots');

