# Payments & Razorpay Integration

This document explains how the backend handles paid enrollments via Razorpay, the configuration that must be present, and the API surface exposed to the dashboard/web client.

## Environment Variables

| Name                                               | Description                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `RAZORPAY_KEY_ID`                                  | Public key returned in `POST /api/payments/orders` response and consumed by the frontend checkout form.                       |
| `RAZORPAY_KEY_SECRET`                              | Private key used by the server when calling Razorpay REST APIs. Keep this secret.                                             |
| `RAZORPAY_WEBHOOK_SECRET`                          | Secret string configured on the Razorpay Dashboard when creating the webhook. Must match exactly so signature checks succeed. |
| `NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_WEB_URL` | Optional CORS allow-list entries for dashboard / website origins.                                                             |

Restart the server (or reload env variables) whenever these values change.

## Request Flow

1. Client calls `POST /api/payments/orders` with the student + product metadata.
2. Server validates student/product, persists a `PaymentIntent`, and creates a Razorpay order.
3. Response contains `orderId`, `amount`, `currency`, `intentId`, and `razorpayKey`. The frontend initializes Razorpay Checkout with these values.
4. Razorpay captures the payment and calls `POST /api/payments/webhook` with the event payload + `x-razorpay-signature` header.
5. Server verifies the signature using `RAZORPAY_WEBHOOK_SECRET`, updates the `PaymentIntent` status, and enrolls the student when payment succeeds.
6. Frontend can poll `GET /api/payments/:intentId` to reflect status.

> **Note:** `productType` currently supports `course`, `testSeries`, and `webinar`. A `test` type is reserved but not yet wired to enrollment helpers.

## API Reference

### POST `/api/payments/orders`

Creates a Razorpay order tied to a pending `PaymentIntent`.

**Body**

```json
{
  "studentId": "<Student ObjectId>",
  "productId": "<Course/TestSeries/Webinar ObjectId>",
  "productType": "course" | "testSeries" | "webinar"
}
```

- Validates the student is active and the product is active/has capacity.
- Rejects the request if the student is already enrolled in the product.

**Response**

```json
{
  "success": true,
  "message": "Payment order created",
  "data": {
    "orderId": "order_ABC123",
    "amount": 250000,
    "currency": "INR",
    "intentId": "6741ac...",
    "razorpayKey": "rzp_test_...",
    "product": {
      "title": "JEE Crash Course",
      "type": "course"
    }
  }
}
```

- `amount` is in paise.
- `intentId` is used for later polling and is added to Razorpay order notes for traceability.

### GET `/api/payments/:id`

Returns the persisted `PaymentIntent` document for dashboards or reconciliation.

**Params**

- `id` – Mongo ObjectId of the intent returned from the order creation step.

### POST `/api/payments/webhook`

Endpoint invoked by Razorpay webhooks. The server requires:

- Header `x-razorpay-signature`
- Raw (unparsed) request body for signature verification – already configured via the custom `express.json` `verify` hook in `index.js`.

When the event represents a captured payment (e.g., `payment.captured` or `order.paid`), the controller:

- Marks the intent as `succeeded`
- Stores Razorpay payment IDs and last event name
- Calls `enrollStudentInProduct` to update the appropriate Course/TestSeries/Webinar and the Student document

Failed or `payment.failed` events mark the intent as `failed` and capture the Razorpay error description in `errorReason`.

## Testing Tips

- Use Razorpay test mode keys and WEBHOOK secret while developing.
- Via Razorpay Dashboard or CLI, send `payment.captured` or `order.paid` events against the webhook URL exposed publicly (or via tunneling such as `ngrok`).
- Inspect `PaymentIntent` documents to verify state transitions (`pending → succeeded/failed`).
- Confirm that successful webhook processing adds entries to `student.courses`, `student.testSeries`, or `student.webinars` depending on `productType`.
