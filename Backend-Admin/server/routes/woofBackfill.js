import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import {
  isFinalizedOrder,
  isFinalizedBooking,
  buildOrderWebhookPayload,
  buildBookingWebhookPayload,
  queueWoofTransactionWebhook,
} from '../services/woofWebhookService.js';

const router = Router();

const parseLimit = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null;
};

const applyLimit = (rows, limit) => (limit ? rows.slice(0, limit) : rows);

const requireBackfillSecret = (req, res, next) => {
  const configuredSecret = process.env.WOOF_BACKFILL_SECRET || process.env.WOOF_WEBHOOK_SECRET;
  const providedSecret = req.get('x-backfill-secret');

  if (!configuredSecret) {
    return res.status(500).json({ message: 'Missing WOOF_BACKFILL_SECRET or WOOF_WEBHOOK_SECRET.' });
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({ message: 'Invalid backfill secret.' });
  }

  return next();
};

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

router.post('/transactions', requireBackfillSecret, async (req, res) => {
  try {
    const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
    const limit = parseLimit(req.query.limit || req.body?.limit);

    const [orders, bookings] = await Promise.all([
      fetchCompletedOrders(),
      fetchCompletedBookings(),
    ]);

    const orderPayloads = applyLimit(orders.map(buildOrderWebhookPayload), limit);
    const bookingPayloads = applyLimit(bookings.map(buildBookingWebhookPayload), limit);
    const payloads = [...orderPayloads, ...bookingPayloads];

    if (dryRun) {
      return res.json({
        ok: true,
        dryRun: true,
        totalReady: payloads.length,
        ordersReady: orderPayloads.length,
        bookingsReady: bookingPayloads.length,
        sampleTransactionIds: payloads.slice(0, 10).map((payload) => payload.transactionId),
      });
    }

    if (!process.env.WOOF_WEBHOOK_URL || !process.env.WOOF_WEBHOOK_SECRET) {
      return res.status(500).json({ message: 'Missing WOOF_WEBHOOK_URL or WOOF_WEBHOOK_SECRET.' });
    }

    const results = await queuePayloads(payloads);

    return res.json({
      ok: true,
      dryRun: false,
      totalReady: payloads.length,
      ordersReady: orderPayloads.length,
      bookingsReady: bookingPayloads.length,
      ...results,
      note: 'Webhook sends are queued asynchronously. Check webhook_deliveries for delivered/failed status.',
    });
  } catch (error) {
    console.error('[WOOF backfill] Failed:', error);
    return res.status(500).json({ message: error?.message || 'Failed to backfill WOOF transactions.' });
  }
});

export default router;
