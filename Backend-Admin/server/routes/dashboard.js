import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const DASHBOARD_CUSTOMER_COLUMNS = 'created_at';
const DASHBOARD_BOOKING_COLUMNS = [
  'id',
  'booking_code',
  'service',
  'service_type',
  'customer_name',
  'customer_phone',
  'customer_email',
  'scheduled_at',
  'appointment_date',
  'appointment_time',
  'appointment_info',
  'booking_status',
  'service_total',
  'pet_info',
  'contact_info',
  'grooming_summary',
  'created_at',
  'updated_at',
].join(', ');
const DASHBOARD_ORDER_COLUMNS = [
  'id',
  'order_code',
  'customer_name',
  'category',
  'status',
  'request_status',
  'order_date',
  'created_at',
  'updated_at',
].join(', ');
const DASHBOARD_INVENTORY_COLUMNS = 'id, name, stock, updated_at';
const DASHBOARD_REVIEW_COLUMNS = 'id, rating, created_at';

const toLocaleTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
};

const formatTimestamp = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfMonth = (date = new Date()) => {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapDashboardNotification = (row) => ({
  id: row.metadata?.bookingCode || row.metadata?.orderCode || row.entity_id,
  recordId: row.entity_id,
  type: row.type,
  title: row.title || (row.type === 'booking' ? 'New Booking' : 'New Order'),
  message: row.message || '',
  time: formatTimestamp(row.created_at),
  read: row.is_read,
  status: row.is_read ? 'accepted' : 'pending',
  createdAt: row.created_at,
});

const mapScheduleItem = (row) => ({
  id: row.booking_code,
  type: row.service_type,
  petName: row.pet_info?.name || 'N/A',
  petType: row.pet_info?.type || 'Pet',
  breed: row.pet_info?.breed || 'Unknown',
  service: row.service || row.service_type,
  owner: row.customer_name,
  contact: row.contact_info?.phone || row.customer_phone || '',
  email: row.contact_info?.email || row.customer_email || '',
  time: row.appointment_info?.time || toLocaleTime(row.scheduled_at),
  date: row.appointment_info?.date || row.appointment_date || row.scheduled_at?.slice(0, 10),
  status: row.booking_status,
  price: `₱${Number(row.service_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  includes: row.grooming_summary?.includes || row.grooming_summary?.services || [],
});

const buildLowStockAlert = (item) => ({
  id: `stock-${item.id}`,
  icon: '⚠️',
  title: 'Low Stock Alert',
  message: `${item.name} is running low (${item.stock} left)`,
  time: item.updated_at ? formatTimestamp(item.updated_at) : 'Inventory',
});

const buildPendingAlert = (row, type) => ({
  id: `${type}-${row.id}`,
  icon: type === 'booking' ? '📅' : '🛒',
  title: type === 'booking' ? 'Pending Booking Request' : 'Pending Order Request',
  message:
    type === 'booking'
      ? `${row.customer_name} needs approval for ${row.service_type}`
      : `${row.customer_name} placed a ${row.category} order`,
  time: formatTimestamp(row.created_at),
});

const buildActivityItem = (title, message, timestamp, icon) => ({
  id: `${title}-${message}-${timestamp}`,
  title,
  message,
  time: formatTimestamp(timestamp),
  icon,
  createdAt: timestamp,
});

async function markDashboardNotificationsRead(filters = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('audience', 'admin')
    .eq('is_read', false);

  if (filters.type) {
    query = query.eq('type', filters.type);
  } else {
    query = query.in('type', ['booking', 'order']);
  }

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  let { error } = await query;

  if (!error) return;

  if (!String(error.message || '').toLowerCase().includes('read_at')) {
    throw error;
  }

  query = supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('audience', 'admin')
    .eq('is_read', false);

  if (filters.type) {
    query = query.eq('type', filters.type);
  } else {
    query = query.in('type', ['booking', 'order']);
  }

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  ({ error } = await query);
  if (error) throw error;
}

async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, entity_id, type, title, message, is_read, created_at, metadata')
    .eq('audience', 'admin')
    .in('type', ['booking', 'order'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  const notifications = (data || [])
    .map(mapDashboardNotification)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const { count, error: countError } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('audience', 'admin')
    .in('type', ['booking', 'order'])
    .eq('is_read', false);

  if (countError) throw countError;

  return {
    notifications,
    unreadCount: count || 0,
  };
}

router.get('/', async (_req, res) => {
  try {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const currentMonthStart = startOfMonth();
    const previousMonthStart = addMonths(currentMonthStart, -1);

    const [
      notificationsData,
      totalCustomersResult,
      currentMonthCustomersResult,
      previousMonthCustomersResult,
      todayBookingsResult,
      pendingOrdersCountResult,
      lowStockInventoryResult,
      pendingBookingsResult,
      pendingOrdersPreviewResult,
      recentCompletedOrdersResult,
      recentCompletedBookingsResult,
      positiveReviewsResult,
    ] = await Promise.all([
      getNotifications(),
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabaseAdmin
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', currentMonthStart.toISOString()),
      supabaseAdmin
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', previousMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString()),
      supabaseAdmin
        .from('bookings')
        .select(DASHBOARD_BOOKING_COLUMNS)
        .neq('booking_status', 'Cancelled')
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .order('scheduled_at', { ascending: true }),
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('request_status', 'Pending Request'),
      supabaseAdmin
        .from('inventory_items')
        .select(DASHBOARD_INVENTORY_COLUMNS)
        .gt('stock', 0)
        .lt('stock', 10)
        .order('stock', { ascending: true }),
      supabaseAdmin
        .from('bookings')
        .select('id, customer_name, service_type, created_at')
        .eq('booking_status', 'Pending Approval')
        .order('created_at', { ascending: false })
        .limit(2),
      supabaseAdmin
        .from('orders')
        .select('id, customer_name, category, request_status, created_at')
        .eq('request_status', 'Pending Request')
        .order('created_at', { ascending: false })
        .limit(2),
      supabaseAdmin
        .from('orders')
        .select('order_code, status, updated_at, created_at')
        .in('status', ['Delivered', 'Order Received'])
        .order('updated_at', { ascending: false })
        .limit(3),
      supabaseAdmin
        .from('bookings')
        .select('service_type, customer_name, updated_at, created_at, booking_status')
        .eq('booking_status', 'Completed')
        .order('updated_at', { ascending: false })
        .limit(3),
      supabaseAdmin
        .from('reviews')
        .select('rating, created_at')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    if (totalCustomersResult.error) throw totalCustomersResult.error;
    if (currentMonthCustomersResult.error) throw currentMonthCustomersResult.error;
    if (previousMonthCustomersResult.error) throw previousMonthCustomersResult.error;
    if (todayBookingsResult.error) throw todayBookingsResult.error;
    if (pendingOrdersCountResult.error) throw pendingOrdersCountResult.error;
    if (lowStockInventoryResult.error) throw lowStockInventoryResult.error;
    if (pendingBookingsResult.error) throw pendingBookingsResult.error;
    if (pendingOrdersPreviewResult.error) throw pendingOrdersPreviewResult.error;
    if (recentCompletedOrdersResult.error) throw recentCompletedOrdersResult.error;
    if (recentCompletedBookingsResult.error) throw recentCompletedBookingsResult.error;
    if (positiveReviewsResult.error) throw positiveReviewsResult.error;

    const totalCustomers = totalCustomersResult.count || 0;
    const currentMonthCustomers = currentMonthCustomersResult.count || 0;
    const previousMonthCustomers = previousMonthCustomersResult.count || 0;
    const todayBookings = todayBookingsResult.data || [];
    const pendingOrders = pendingOrdersCountResult.count || 0;
    const inventoryItems = lowStockInventoryResult.data || [];
    const pendingBookings = pendingBookingsResult.data || [];
    const pendingOrderRows = pendingOrdersPreviewResult.data || [];
    const recentCompletedOrders = recentCompletedOrdersResult.data || [];
    const recentCompletedBookings = recentCompletedBookingsResult.data || [];
    const reviews = positiveReviewsResult.data || [];

    const customerGrowth = previousMonthCustomers > 0
      ? Math.round(((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100)
      : currentMonthCustomers > 0 ? 100 : 0;

    const schedule = todayBookings
      .slice(0, 5)
      .map(mapScheduleItem);

    const alerts = [
      ...inventoryItems.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) < 10).slice(0, 3).map(buildLowStockAlert),
      ...pendingBookings.map((row) => buildPendingAlert(row, 'booking')),
      ...pendingOrderRows.map((row) => buildPendingAlert(row, 'order')),
    ]
      .sort((a, b) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 5);

    const recentActivity = [
      ...recentCompletedOrders
        .map((order) => buildActivityItem('Order Completed', `${order.order_code} has been delivered`, order.updated_at || order.created_at, '✅')),
      ...recentCompletedBookings
        .map((booking) => buildActivityItem('Booking Completed', `${booking.service_type} for ${booking.customer_name} is complete`, booking.updated_at || booking.created_at, '✅')),
      ...reviews
        .map((review) => buildActivityItem('Customer Feedback', `New ${review.rating}-star review received`, review.created_at, '⭐')),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      ...notificationsData,
      stats: {
        totalCustomers,
        customerGrowth,
        todayBookings: todayBookings.length,
        pendingOrders,
      },
      schedule,
      alerts,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load dashboard.' });
  }
});

router.patch('/notifications/read-all', async (_req, res) => {
  try {
    await markDashboardNotificationsRead();

    const notificationsData = await getNotifications();
    res.json({
      notifications: notificationsData.notifications,
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark dashboard notifications as read.' });
  }
});

router.patch('/notifications/:type/:id/read', async (req, res) => {
  const { type, id } = req.params;

  if (!['booking', 'order'].includes(type)) {
    return res.status(400).json({ message: 'Invalid notification type.' });
  }

  try {
    await markDashboardNotificationsRead({ type, entityId: id });

    const notificationsData = await getNotifications();
    res.json(notificationsData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update dashboard notification.' });
  }
});

export default router;
