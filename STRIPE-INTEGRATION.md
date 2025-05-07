# Stripe Payment Integration

This document explains how to set up and configure the Stripe payment integration for the LA Bookings system.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com) if you don't have one)
2. API keys from your Stripe dashboard
3. Node.js server running your LA Bookings API
4. WordPress site with the booking form

## Configuration Steps

### 1. Add API Keys

You need to update the following files with your Stripe API keys:

#### Frontend (WordPress)
In `booking-form.js`, replace the placeholder with your **publishable key**:
```javascript
const stripe = Stripe('REPLACE_WITH_YOUR_PUBLISHABLE_KEY');
```

#### Backend (Express)
In `controllers/payment.controller.js`, replace the placeholder with your **secret key**:
```javascript
const stripe = require('stripe')('REPLACE_WITH_YOUR_SECRET_KEY');
```

### 2. Set Up Webhooks

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add Endpoint"
3. Enter your API endpoint URL: `https://your-api-domain.com/api/payments/webhook`
4. Select the following events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing Secret" provided by Stripe
6. In `controllers/payment.controller.js`, replace the webhook secret:
```javascript
const endpointSecret = 'REPLACE_WITH_YOUR_WEBHOOK_SECRET';
```

### 3. Install Dependencies

On your server, install the Stripe package:
```bash
npm install stripe@latest
```

### 4. Test the Integration

1. Make a test booking using Stripe's test cards:
   - Success card: `4242 4242 4242 4242`
   - Failure card: `4000 0000 0000 0002`
2. Use any future expiration date and any 3-digit CVC
3. Verify that bookings are created and marked as paid

## How It Works

1. When a customer reaches the payment step, Stripe Elements loads a secure payment form
2. Upon submission, the API creates a Payment Intent with Stripe
3. The frontend confirms the payment using the customer's card details
4. On successful payment, the booking is created with payment status "paid"
5. Stripe webhooks provide additional security by confirming the payment server-side

## Troubleshooting

- If payments aren't processing, check your browser console for error messages
- Verify your API keys are correct (test keys for test mode, live keys for production)
- Ensure webhooks are properly configured and receiving events
- Check the server logs for detailed error information

## Going Live

When ready to accept real payments:
1. Switch from Stripe test mode to live mode in your Stripe Dashboard
2. Replace test API keys with live API keys
3. Set up webhooks in your live Stripe environment
4. Test a real transaction with a small amount

For any support issues, contact Stripe support or refer to the [Stripe documentation](https://stripe.com/docs). 