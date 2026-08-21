import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const WOOF_PROVIDER = 'WOOF';
const TRANSACTION_COMPLETED_EVENT = 'pethub.transaction.completed';
const FINAL_ORDER_STATUSES = new Set(['delivered', 'order received', 'completed', 'fulfilled']);
const FINAL_BOOKING_STATUSES = new Set(['completed']);
const FINAL_PAYMENT_STATUSES = new Set(['paid', 'completed']);
const EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'failed', 'unpaid', 'pending', 'draft']);
const CAFE_CATEGORIES = new Set(['pet menu', 'pet bakery', 'cafe', 'food', 'drinks']);
const SERVICES_CATEGORIES = new Set(['grooming', 'boarding', 'pet hotel', 'events', 'services', 'birthday party', 'general']);
const RETAIL_CATEGORIES = new Set(['pet shop', 'pet supplies', 'retail', 'products']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const asNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeKey = (value) => asText(value).toLowerCase();

export function inferSector(category = '', fallbackSector = '') {
  const explicitSector = asText(fallbackSector);
  if (explicitSector) return explicitSector;

  const normalized = normalizeKey(category);
  if (CAFE_CATEGORIES.has(normalized)) return 'Cafe';
  if (SERVICES_CATEGORIES.has(normalized)) return 'Services';
  if (RETAIL_CATEGORIES.has(normalized)) return 'Retail';
  return 'Retail';
}

export function isFinalizedOrder(order = {}) {
  const status = normalizeKey(order.status);
  const deliveryStatus = normalizeKey(order.delivery_status);
  const paymentStatus = normalizeKey(order.payment_status);
  const refundStatus = normalizeKey(order.refund_status || 'none');

  if (EXCLUDED_STATUSES.has(status) || EXCLUDED_STATUSES.has(paymentStatus) || refundStatus === 'refunded') {
    return false;
  }

  return (FINAL_ORDER_STATUSES.has(status) || FINAL_ORDER_STATUSES.has(deliveryStatus))
    && FINAL_PAYMENT_STATUSES.has(paymentStatus);
}

export function isFinalizedBooking(booking = {}) {
  const bookingStatus = normalizeKey(booking.booking_status);
  const paymentStatus = normalizeKey(booking.payment_status);

  if (EXCLUDED_STATUSES.has(bookingStatus) || EXCLUDED_STATUSES.has(paymentStatus)) {
    return false;
  }

  return FINAL_BOOKING_STATUSES.has(bookingStatus) && FINAL_PAYMENT_STATUSES.has(paymentStatus);
}

function normalizeOrderItem(item = {}, order = {}) {
  const category = asText(item.category || item.type || order.category || 'Pet Shop');
  const quantity = Math.max(asNumber(item.quantity ?? item.qty, 1), 0);
  const unitPrice = asNumber(item.unitPrice ?? item.unit_price ?? item.price, 0);
  const grossAmount = asNumber(item.grossAmount ?? item.gross_amount ?? item.subtotal ?? item.total, unitPrice * quantity);
  const discountAmount = asNumber(item.discountAmount ?? item.discount_amount ?? item.discount, 0);
  const netAmount = asNumber(item.netAmount ?? item.net_amount, grossAmount - discountAmount);

  return {
    itemId: asText(item.itemId ?? item.item_id ?? item.id),
    name: asText(item.name || item.productName || item.label || 'PetHub item'),
    sku: asText(item.sku || item.code),
    category,
    sector: inferSector(category, item.sector),
    quantity,
    unitPrice,
    grossAmount,
    discountAmount,
    netAmount,
  };
}

function normalizeBookingItem(booking = {}) {
  const category = asText(booking.service_type || booking.service || 'Services');
  const netAmount = asNumber(booking.service_total, 0);

  return {
    itemId: asText(booking.service_details?.serviceId || booking.metadata?.serviceId),
    name: asText(booking.service || booking.service_type || 'PetHub service'),
    sku: asText(booking.service_details?.sku || booking.metadata?.sku),
    category,
    sector: inferSector(category),
    quantity: 1,
    unitPrice: netAmount,
    grossAmount: netAmount,
    discountAmount: 0,
    netAmount,
  };
}

function buildTotals(items = [], fallbackTotal = 0) {
  const totals = items.reduce((sum, item) => ({
    grossAmount: sum.grossAmount + asNumber(item.grossAmount),
    discountAmount: sum.discountAmount + asNumber(item.discountAmount),
    netAmount: sum.netAmount + asNumber(item.netAmount),
    quantity: sum.quantity + asNumber(item.quantity),
  }), {
    grossAmount: 0,
    discountAmount: 0,
    netAmount: 0,
    quantity: 0,
  });

  if (!totals.netAmount && fallbackTotal) {
    totals.grossAmount = asNumber(fallbackTotal);
    totals.netAmount = asNumber(fallbackTotal);
    totals.quantity = totals.quantity || 1;
  }

  return totals;
}

export function buildOrderWebhookPayload(order = {}) {
  const items = (Array.isArray(order.items) ? order.items : [])
    .map((item) => normalizeOrderItem(item, order))
    .filter((item) => item.name && item.quantity > 0);
  const fallbackTotal = asNumber(order.total || order.base_total, 0);

  return {
    event: TRANSACTION_COMPLETED_EVENT,
    source: 'PetHub',
    transactionId: `order:${asText(order.order_code || order.id)}`,
    transactionType: 'order',
    orderId: asText(order.order_code || order.id),
    bookingId: '',
    completedAt: asText(order.updated_at || order.order_date || new Date().toISOString()),
    customerId: asText(order.user_id),
    customerName: asText(order.customer_name),
    paymentMethod: asText(order.payment_method),
    paymentStatus: asText(order.payment_status),
    status: asText(order.status || order.delivery_status),
    items,
    totals: buildTotals(items, fallbackTotal),
  };
}

export function buildBookingWebhookPayload(booking = {}) {
  const items = [normalizeBookingItem(booking)];

  return {
    event: TRANSACTION_COMPLETED_EVENT,
    source: 'PetHub',
    transactionId: `booking:${asText(booking.booking_code || booking.id)}`,
    transactionType: 'booking',
    orderId: '',
    bookingId: asText(booking.booking_code || booking.id),
    completedAt: asText(booking.updated_at || booking.scheduled_at || new Date().toISOString()),
    customerId: asText(booking.user_id),
    customerName: asText(booking.customer_name),
    paymentMethod: asText(booking.payment_method),
    paymentStatus: asText(booking.payment_status),
    status: asText(booking.booking_status),
    items,
    totals: buildTotals(items, booking.service_total),
  };
}

async function getExistingDelivery(transactionId) {
  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('id, status, attempts')
    .eq('provider', WOOF_PROVIDER)
    .eq('event', TRANSACTION_COMPLETED_EVENT)
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function createOrClaimDelivery(payload) {
  const existing = await getExistingDelivery(payload.transactionId);
  if (existing?.status === 'delivered' || existing?.status === 'pending') {
    return { shouldSend: false, delivery: existing };
  }

  if (existing?.status === 'failed' && Number(existing.attempts || 0) >= 6) {
    return { shouldSend: false, delivery: existing };
  }

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('webhook_deliveries')
      .update({
        status: 'pending',
        payload,
        last_error: null,
        last_status_code: null,
      })
      .eq('id', existing.id)
      .select('id, status, attempts')
      .single();

    if (error) throw error;
    return { shouldSend: true, delivery: data };
  }

  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .insert({
      provider: WOOF_PROVIDER,
      event: TRANSACTION_COMPLETED_EVENT,
      transaction_id: payload.transactionId,
      transaction_type: payload.transactionType,
      status: 'pending',
      payload,
    })
    .select('id, status, attempts')
    .single();

  if (error?.code === '23505') {
    return { shouldSend: false, delivery: await getExistingDelivery(payload.transactionId) };
  }
  if (error) throw error;

  return { shouldSend: true, delivery: data };
}

async function updateDelivery(deliveryId, patch) {
  const { error } = await supabaseAdmin
    .from('webhook_deliveries')
    .update({
      ...patch,
      last_attempt_at: new Date().toISOString(),
    })
    .eq('id', deliveryId);

  if (error) {
    console.warn('[WOOF webhook] Failed to update delivery log:', error.message || error);
  }
}

async function postWebhook(payload, delivery) {
  const webhookUrl = asText(process.env.WOOF_WEBHOOK_URL);
  const webhookSecret = asText(process.env.WOOF_WEBHOOK_SECRET);

  if (!webhookUrl || !webhookSecret) {
    await updateDelivery(delivery.id, {
      status: 'skipped',
      last_error: 'Missing WOOF_WEBHOOK_URL or WOOF_WEBHOOK_SECRET.',
    });
    console.warn('[WOOF webhook] Skipped. Missing WOOF_WEBHOOK_URL or WOOF_WEBHOOK_SECRET.');
    return;
  }

  let lastError = '';
  let lastStatusCode = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pethub-webhook-secret': webhookSecret,
        },
        body: JSON.stringify(payload),
      });

      lastStatusCode = response.status;

      if (response.ok) {
        await updateDelivery(delivery.id, {
          status: 'delivered',
          attempts: Number(delivery.attempts || 0) + attempt,
          last_status_code: response.status,
          last_error: null,
          delivered_at: new Date().toISOString(),
        });
        console.log(`[WOOF webhook] Delivered ${payload.transactionId} (${response.status}).`);
        return;
      }

      lastError = `WOOF responded with ${response.status}: ${await response.text().catch(() => '')}`;
    } catch (error) {
      lastError = error?.message || String(error);
    }

    if (attempt < 3) {
      await sleep(500 * attempt);
    }
  }

  await updateDelivery(delivery.id, {
    status: 'failed',
    attempts: Number(delivery.attempts || 0) + 3,
    last_status_code: lastStatusCode,
    last_error: lastError || 'Unknown webhook failure.',
  });
  console.warn(`[WOOF webhook] Failed ${payload.transactionId}: ${lastError}`);
}

export async function queueWoofTransactionWebhook(payload) {
  if (!payload?.transactionId) {
    console.warn('[WOOF webhook] Skipped payload without transactionId.');
    return { queued: false };
  }

  const { shouldSend, delivery } = await createOrClaimDelivery(payload);
  if (!shouldSend) {
    console.log(`[WOOF webhook] Skipped duplicate ${payload.transactionId}; status=${delivery?.status || 'unknown'}.`);
    return { queued: false, duplicate: true };
  }

  setTimeout(() => {
    postWebhook(payload, delivery).catch((error) => {
      console.warn('[WOOF webhook] Unexpected sender error:', error?.message || error);
    });
  }, 0);

  return { queued: true };
}

export async function queueOrderWebhookIfFinalized(order) {
  if (!isFinalizedOrder(order)) return { queued: false, reason: 'order_not_finalized' };
  return queueWoofTransactionWebhook(buildOrderWebhookPayload(order));
}

export async function queueBookingWebhookIfFinalized(booking) {
  if (!isFinalizedBooking(booking)) return { queued: false, reason: 'booking_not_finalized' };
  return queueWoofTransactionWebhook(buildBookingWebhookPayload(booking));
}
