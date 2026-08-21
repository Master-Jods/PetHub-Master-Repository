import 'dotenv/config';
import { supabaseAdmin } from '../server/lib/supabaseAdmin.js';
import {
  isFinalizedOrder,
  isFinalizedBooking,
  buildOrderWebhookPayload,
  buildBookingWebhookPayload,
  queueWoofTransactionWebhook,
} from '../server/services/woofWebhookService.js';

const args = new Set(process.argv.slice(2));
const shouldSend = args.has('--confirm');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const waitMs = Number(process.env.WOOF_BACKFILL_WAIT_MS || 10000);

function applyLimit(rows) {
  if (!Number.isFinite(limit) || limit <= 0) return rows;
  return rows.slice(0, limit);
}

function printPayloadPreview(label, payloads) {
  console.log(`\n${label}: ${payloads.length}`);
  payloads.slice(0, 5).forEach((payload) => {
    console.log(`- ${payload.transactionId} | ${payload.customerName || 'Unknown customer'} | ${payload.totals.netAmount}`);
  });
  if (payloads.length > 5) {
    console.log(`...and ${payloads.length - 5} more`);
  }
}

async function fetchCompletedOrders() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_code,
      user_id,
      category,
      customer_name,
      order_date,
      items,
      base_total,
      total,
      status,
      payment_method,
      payment_status,
      delivery_status,
      refund_status,
      updated_at
    `)
    .order('updated_at', { ascending: true });

  if (error) throw error;
  return (data || []).filter(isFinalizedOrder);
}

async function fetchCompletedBookings() {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      booking_code,
      user_id,
      service,
      service_type,
      scheduled_at,
      customer_name,
      service_total,
      payment_method,
      payment_status,
      booking_status,
      service_details,
      metadata,
      updated_at
    `)
    .order('updated_at', { ascending: true });

  if (error) throw error;
  return (data || []).filter(isFinalizedBooking);
}

async function queuePayloads(payloads) {
  const results = {
    queued: 0,
    duplicates: 0,
    skipped: 0,
    failed: 0,
  };

  for (const payload of payloads) {
    try {
      const result = await queueWoofTransactionWebhook(payload);
      if (result.queued) {
        results.queued += 1;
      } else if (result.duplicate) {
        results.duplicates += 1;
      } else {
        results.skipped += 1;
      }
    } catch (error) {
      results.failed += 1;
      console.warn(`[WOOF backfill] Failed to queue ${payload.transactionId}:`, error?.message || error);
    }
  }

  return results;
}

async function main() {
  console.log(`[WOOF backfill] Mode: ${shouldSend ? 'SEND' : 'DRY RUN'}`);
  if (limit) console.log(`[WOOF backfill] Limit: ${limit}`);

  const [orders, bookings] = await Promise.all([
    fetchCompletedOrders(),
    fetchCompletedBookings(),
  ]);

  const orderPayloads = applyLimit(orders.map(buildOrderWebhookPayload));
  const bookingPayloads = applyLimit(bookings.map(buildBookingWebhookPayload));
  const payloads = [...orderPayloads, ...bookingPayloads];

  printPayloadPreview('Completed paid orders ready for WOOF', orderPayloads);
  printPayloadPreview('Completed paid bookings ready for WOOF', bookingPayloads);

  console.log(`\nTotal ready: ${payloads.length}`);

  if (!shouldSend) {
    console.log('\nDry run only. To send these to WOOF, run: npm run webhook:backfill:woof -- --confirm');
    return;
  }

  if (!process.env.WOOF_WEBHOOK_URL || !process.env.WOOF_WEBHOOK_SECRET) {
    throw new Error('Missing WOOF_WEBHOOK_URL or WOOF_WEBHOOK_SECRET.');
  }

  const results = await queuePayloads(payloads);
  console.log('\nQueued summary:', results);
  console.log(`[WOOF backfill] Waiting ${waitMs}ms for async webhook sends to finish...`);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  console.log('[WOOF backfill] Done. Check webhook_deliveries for delivered/failed status.');
}

main().catch((error) => {
  console.error('[WOOF backfill] Failed:', error?.message || error);
  process.exitCode = 1;
});
