import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const PAYMENT_METHOD_OPTIONS = ['Cash', 'GCash'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const ORDER_STATUS_OPTIONS = ['Pending', 'Order Placed', 'Preparing Order', 'Rider Picked Up', 'Out for Delivery', 'Delivered', 'Order Received', 'Cancelled'];
const REQUEST_STATUS_OPTIONS = ['Pending Request', 'Accepted', 'Rejected'];
const DELIVERY_METHOD_OPTIONS = ['Store Pickup', 'Delivery'];
const DELIVERY_ZONE_RATES = {
  Pleasantville: 0,
  'Ibabang Iyam/Ilayang Iyam': 50,
  'Brgy. 1-11 (Town proper area)': 70,
  'Gulang-gulang/Bocohan': 120,
  'Domoit/Ibabang Dupay/Red-V/Marketview/Ilayang Dupay/Silangang Mayao/Mayao Parada/Cotta/Isabang': 150
};

const mapNotification = (row) => ({
  id: row.metadata?.orderCode || row.entity_id,
  title: row.title || 'New Order',
  message: row.message || 'A new order was submitted.',
  time: new Date(row.created_at).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }),
  read: row.is_read,
  status: row.is_read ? 'accepted' : 'pending'
});

const mapOrder = (row) => ({
  id: row.id,
  orderId: row.order_code,
  category: row.category,
  customer: row.customer_name,
  email: row.customer_email,
  phone: row.customer_phone,
  date: row.order_date,
  items: row.items || [],
  baseTotal: Number(row.base_total || 0),
  total: Number(row.total || 0),
  status: row.status,
  requestStatus: row.request_status,
  rejectionReason: row.rejection_reason,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  deliveryMethod: row.delivery_method || 'Store Pickup',
  deliveryZone: row.delivery_zone || '',
  deliveryFee: Number(row.delivery_fee || 0),
  shippingAddress: row.shipping_address,
  eta: row.eta,
  rider: row.rider_snapshot,
  timeline: row.timeline || [],
  proofOfPayment: row.proof_of_payment
});

async function getRecentNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('entity_id, title, message, is_read, created_at, metadata')
    .eq('audience', 'admin')
    .eq('type', 'order')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []).map(mapNotification);
}

async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('audience', 'admin')
    .eq('type', 'order')
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_code,
        category,
        customer_name,
        customer_email,
        customer_phone,
        order_date,
        items,
        base_total,
        total,
        status,
        request_status,
        rejection_reason,
        payment_method,
        payment_status,
        delivery_method,
        delivery_zone,
        delivery_fee,
        shipping_address,
        eta,
        rider_snapshot,
        timeline,
        proof_of_payment,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      orders: (data || []).map(mapOrder),
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load orders.' });
  }
});

router.patch('/notifications/read-all', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('audience', 'admin')
      .eq('type', 'order')
      .eq('is_read', false);

    if (error) throw error;

    const notifications = await getRecentNotifications();
    res.json({
      notifications,
      unreadCount: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark order notifications as read.' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const patch = {};

  if (req.body.paymentMethod !== undefined) {
    if (!PAYMENT_METHOD_OPTIONS.includes(req.body.paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method.' });
    }
    patch.payment_method = req.body.paymentMethod;
  }

  if (req.body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUS_OPTIONS.includes(req.body.paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status.' });
    }
    patch.payment_status = req.body.paymentStatus;
  }

  if (req.body.status !== undefined) {
    if (!ORDER_STATUS_OPTIONS.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }
    patch.status = req.body.status;
  }

  if (req.body.requestStatus !== undefined) {
    if (!REQUEST_STATUS_OPTIONS.includes(req.body.requestStatus)) {
      return res.status(400).json({ message: 'Invalid request status.' });
    }
    patch.request_status = req.body.requestStatus;
  }

  if (req.body.rejectionReason !== undefined) {
    patch.rejection_reason = req.body.rejectionReason;
  }

  if (req.body.shippingAddress !== undefined) {
    patch.shipping_address = req.body.shippingAddress;
  }

  if (req.body.rider !== undefined) {
    patch.rider_snapshot = req.body.rider;
  }

  if (req.body.eta !== undefined) {
    patch.eta = req.body.eta;
  }

  if (req.body.timeline !== undefined) {
    patch.timeline = req.body.timeline;
  }

  if (req.body.total !== undefined) {
    patch.total = Number(req.body.total);
  }

  if (
    req.body.deliveryMethod !== undefined
    || req.body.deliveryZone !== undefined
    || req.body.deliveryFee !== undefined
  ) {
    const { data: existingData, error: existingError } = await supabaseAdmin
      .from('orders')
      .select('delivery_method, delivery_zone, delivery_fee')
      .eq('order_code', id)
      .single();

    if (existingError) {
      return res.status(500).json({ message: existingError.message || 'Failed to load delivery details.' });
    }

    const nextDeliveryMethod = req.body.deliveryMethod ?? existingData.delivery_method ?? 'Store Pickup';
    const nextDeliveryZone = req.body.deliveryZone ?? existingData.delivery_zone ?? '';
    const requestedDeliveryFee = req.body.deliveryFee ?? existingData.delivery_fee ?? 0;

    if (!DELIVERY_METHOD_OPTIONS.includes(nextDeliveryMethod)) {
      return res.status(400).json({ message: 'Invalid delivery method.' });
    }

    if (nextDeliveryMethod === 'Delivery') {
      if (!(nextDeliveryZone in DELIVERY_ZONE_RATES)) {
        return res.status(400).json({ message: 'Delivery is only available within supported Lucena City areas.' });
      }

      const expectedRate = DELIVERY_ZONE_RATES[nextDeliveryZone];
      if (Number(requestedDeliveryFee) !== Number(expectedRate)) {
        return res.status(400).json({ message: 'Invalid delivery fee for the selected Lucena City area.' });
      }

      patch.delivery_method = nextDeliveryMethod;
      patch.fulfillment_method = 'delivery';
      patch.delivery_zone = nextDeliveryZone;
      patch.delivery_fee = expectedRate;
    } else {
      patch.delivery_method = 'Store Pickup';
      patch.fulfillment_method = 'pickup';
      patch.delivery_zone = '';
      patch.delivery_fee = 0;
    }
  }

  patch.updated_at = new Date().toISOString();

  try {
    const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_code', id)
      .single();

    if (existingOrderError) throw existingOrderError;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('order_code', id)
      .select(`
        id,
        order_code,
        category,
        customer_name,
        customer_email,
        customer_phone,
        order_date,
        items,
        base_total,
        total,
        status,
        request_status,
        rejection_reason,
        payment_method,
        payment_status,
        delivery_method,
        delivery_zone,
        delivery_fee,
        shipping_address,
        eta,
        rider_snapshot,
        timeline,
        proof_of_payment
      `)
      .single();

    if (error) throw error;

    if (patch.request_status && patch.request_status !== 'Pending Request') {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('audience', 'admin')
        .eq('type', 'order')
        .eq('entity_id', existingOrder.id)
        .eq('is_read', false);

      if (notificationError) throw notificationError;
    }

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      order: mapOrder(data),
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order.' });
  }
});

export default router;
