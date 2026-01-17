# RazorpayX Payout Webhooks Setup Guide

This guide explains how to configure webhooks for RazorpayX payouts in the Faculty Pedia system.

## Overview

Webhooks are used to automatically receive notifications about payout status changes from RazorpayX. This allows the system to update payout records in real-time without polling the Razorpay API.

## Webhook Endpoint

**URL**: `https://yourdomain.com/api/payments/webhook`

**Method**: `POST`

**Content-Type**: `application/json`

## Required Webhook Events

Subscribe to the following events in RazorpayX Dashboard:

1. **`payout.queued`** - Triggered when a payout is queued for processing
2. **`payout.initiated`** - Triggered when a payout has been initiated
3. **`payout.processed`** - Triggered when a payout is successfully processed
4. **`payout.failed`** - Triggered when a payout fails
5. **`payout.reversed`** - Triggered when a payout is reversed
6. **`transaction.created`** - Triggered when a transaction is created (for audit purposes)

## Setup Instructions

### Step 1: Access RazorpayX Dashboard

1. Log in to the [RazorpayX Dashboard](https://dashboard.razorpayx.com/)
2. Navigate to **My Account & Settings** → **Developer Controls**
3. Scroll down to the **WEBHOOKS** section

### Step 2: Add Webhook

1. Click **Add Webhooks** (or **Edit Webhook** if updating existing)
2. Enter the **Webhook URL**: `https://yourdomain.com/api/payments/webhook`
   - **Important**: Webhooks can only be delivered to public URLs (ports 80 or 443)
   - Localhost endpoints are not supported. Use a service like [ngrok](https://ngrok.com/) for local testing
3. Enter a **Secret** for webhook validation
   - This is optional but **highly recommended** for security
   - The secret should be a strong, random string
   - **Note**: This secret is different from your Razorpay API keys
4. Select the following events from **Active Events**:
   - `payout.queued`
   - `payout.initiated`
   - `payout.processed`
   - `payout.failed`
   - `payout.reversed`
   - `transaction.created`
5. Click **SAVE** to enable the webhook

### Step 3: Configure Environment Variable

1. Add the webhook secret to your environment variables:
   ```bash
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```
2. Ensure this matches the secret you configured in RazorpayX Dashboard
3. Restart your server after adding the environment variable

### Step 4: Test Mode Setup

For testing in **Test Mode**:

1. Use the default OTP `754081` when prompted during webhook setup
2. Configure a separate webhook URL for test mode if needed
3. In test mode, payout status transitions don't happen automatically:
   - After creating a payout, it goes to `processing` status
   - You must manually change the status in RazorpayX Dashboard to trigger webhooks
   - Go to **Payouts** → Select payout → Change status to "Processed" or "Failed"
   - The webhook will fire after manual status change

## Webhook Signature Verification

The system automatically verifies webhook signatures using HMAC SHA256:

1. Razorpay sends the webhook payload with an `x-razorpay-signature` header
2. The system computes the expected signature using:
   - Raw request body
   - Webhook secret from `RAZORPAY_WEBHOOK_SECRET`
3. If signatures don't match, the webhook is rejected with a 400 status

## Webhook Payload Structure

### Payout Events

```json
{
  "event": "payout.processed",
  "payload": {
    "payout": {
      "entity": {
        "id": "pout_xxxxxxxxxxxxx",
        "reference_id": "payoutCheckId",
        "status": "processed",
        "utr": "UTR123456789",
        "amount": 10000,
        "currency": "INR",
        "failure_reason": null
      }
    }
  }
}
```

### Transaction Created Event

```json
{
  "event": "transaction.created",
  "payload": {
    "transaction": {
      "entity": {
        "id": "txn_xxxxxxxxxxxxx",
        "reference_id": "payoutCheckId",
        "type": "payout",
        "status": "processed"
      }
    }
  }
}
```

## Status Mapping

The system maps webhook events to payout statuses as follows:

| Webhook Event         | Payout Status | Description                             |
| --------------------- | ------------- | --------------------------------------- |
| `payout.queued`       | `processing`  | Payout is queued for processing         |
| `payout.initiated`    | `processing`  | Payout has been initiated               |
| `payout.processed`    | `paid`        | Payout completed successfully           |
| `payout.failed`       | `failed`      | Payout failed                           |
| `payout.reversed`     | `reversed`    | Payout was reversed                     |
| `transaction.created` | (no change)   | Logged for audit, doesn't change status |

## Webhook Processing Flow

1. **Receive Webhook**: Server receives POST request at `/api/payments/webhook`
2. **Verify Signature**: System verifies the `x-razorpay-signature` header
3. **Parse Event**: Extract event name and payload
4. **Find Payout**: Match `reference_id` from payload with `payoutCheckId` in database
5. **Update Status**: Update payout status based on event type
6. **Send Invoice**: If payout is processed, send invoice email to educator
7. **Return Response**: Return 200 status to acknowledge receipt

## Error Handling

- **Missing Signature**: Returns 400 with error message
- **Invalid Signature**: Returns 400 with error message
- **Missing reference_id**: Logs warning, returns 200 (prevents Razorpay retries)
- **Payout Not Found**: Logs warning, returns 200 (prevents Razorpay retries)
- **Processing Error**: Logs error, returns 500

## Webhook Retry Policy

Razorpay retries failed webhooks with exponential backoff:

- Webhook must return a **2XX status code** within **5 seconds**
- If webhook fails, Razorpay retries for up to **24 hours**
- After 24 hours of failures, the webhook is **disabled**
- You'll receive an email notification when webhook is disabled
- Re-enable the webhook from RazorpayX Dashboard after fixing issues

## Testing Webhooks Locally

### Using ngrok

1. Install [ngrok](https://ngrok.com/)
2. Start your local server on port 3000 (or your configured port)
3. Run ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Configure webhook URL in RazorpayX Dashboard: `https://abc123.ngrok.io/api/payments/webhook`
6. Test webhooks by triggering payout events

### Manual Testing

1. Create a payout through the system
2. Check server logs for webhook receipt
3. Verify payout status is updated correctly
4. In test mode, manually change payout status in RazorpayX Dashboard
5. Verify webhook is received and processed

## Monitoring and Debugging

### Logs to Monitor

The system logs comprehensive information for each webhook:

- Event name and type
- Reference ID and Payout ID
- Status transitions (previous → new)
- UTR and failure reasons (when available)
- Email sending status (for processed payouts)
- Warnings for missing or invalid data

### Example Log Output

```
[Webhook] Received event: payout.processed
[Webhook] Payout event details: { event: 'payout.processed', referenceId: 'payout_123', payoutId: 'pout_xxx', status: 'processed' }
[Webhook] Found payout: { payoutId: '...', referenceId: 'payout_123', currentStatus: 'processing', newEvent: 'payout.processed' }
[Webhook] Payout processed: payout_123 (processing → paid) { utr: 'UTR123', razorpayPayoutId: 'pout_xxx' }
[Webhook] Payout status updated: payout_123 → paid
[Webhook] Sending invoice email to educator: educator@example.com
[Webhook] Invoice email sent successfully to: educator@example.com
```

## Security Considerations

1. **Always use HTTPS** for webhook URLs
2. **Set a strong webhook secret** and keep it secure
3. **Verify webhook signatures** (automatically handled by the system)
4. **Whitelist Razorpay IPs** if using firewall rules
5. **Monitor webhook logs** for suspicious activity
6. **Never expose webhook secret** in client-side code or logs

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is publicly accessible
2. Verify webhook is enabled in RazorpayX Dashboard
3. Check server logs for incoming requests
4. Verify firewall/security groups allow Razorpay IPs
5. Check if webhook was disabled due to repeated failures

### Invalid Signature Error

1. Verify `RAZORPAY_WEBHOOK_SECRET` matches dashboard secret
2. Ensure secret doesn't have extra spaces or characters
3. Check that raw body is being captured correctly (handled automatically)

### Payout Status Not Updating

1. Check server logs for webhook receipt
2. Verify `reference_id` matches `payoutCheckId` in database
3. Check for errors in webhook processing logs
4. Verify payout record exists in database
5. Check if webhook returned 200 status (check RazorpayX Dashboard webhook logs)

### Webhook Disabled

1. Check email for notification about webhook disablement
2. Review server logs for errors during webhook processing
3. Fix the underlying issue
4. Re-enable webhook from RazorpayX Dashboard
5. Test with a new payout event

## Additional Resources

- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [RazorpayX Payout Webhooks Setup](https://razorpay.com/docs/webhooks/setup-edit-payouts/)
- [Razorpay IPs and Certificates](https://razorpay.com/docs/webhooks/ip-whitelisting/)
- [Webhook Best Practices](https://razorpay.com/docs/webhooks/best-practices/)

## Support

For issues related to:

- **Webhook configuration**: Check RazorpayX Dashboard settings
- **Code implementation**: Review `facultypedia-server/controllers/payment.controller.js`
- **Environment setup**: Verify `RAZORPAY_WEBHOOK_SECRET` is configured correctly
