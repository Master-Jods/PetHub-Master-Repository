import 'dotenv/config';
import { queueWoofTransactionWebhook } from '../server/services/woofWebhookService.js';

const now = new Date().toISOString();

const samplePayload = {
  event: 'pethub.transaction.completed',
  source: 'PetHub',
  transactionId: `dev-sample:${process.env.WOOF_SAMPLE_TRANSACTION_ID || 'pethub-woof-sample-001'}`,
  transactionType: 'order',
  orderId: 'DEV-ORDER-001',
  bookingId: '',
  completedAt: now,
  customerId: 'dev-customer-001',
  customerName: 'PetHub Dev Customer',
  paymentMethod: 'GCash',
  paymentStatus: 'Paid',
  status: 'Completed',
  items: [
    {
      itemId: 'dev-item-001',
      name: 'Sample Grooming Package',
      sku: 'DEV-GROOM-001',
      category: 'Grooming',
      sector: 'Services',
      quantity: 1,
      unitPrice: 100,
      grossAmount: 100,
      discountAmount: 0,
      netAmount: 100,
    },
  ],
  totals: {
    grossAmount: 100,
    discountAmount: 0,
    netAmount: 100,
    quantity: 1,
  },
};

const result = await queueWoofTransactionWebhook(samplePayload);
console.log(JSON.stringify({ queued: result.queued, duplicate: Boolean(result.duplicate), transactionId: samplePayload.transactionId }, null, 2));

// Give the non-blocking sender time to finish when this script is used manually.
setTimeout(() => process.exit(0), 6000);
