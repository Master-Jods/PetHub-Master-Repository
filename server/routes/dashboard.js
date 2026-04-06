import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const toLocaleTime = (value) => {
  if (!value) return '';
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
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

const mapDashboardNotification = (row, type) => ({
  id: row[`${type}_id`],
  recordId: row[`${type}_id`],
  type,
  title: type === 'booking' ? 'New Booking' : 'New Order',
  message:
    type === 'booking'
      ? `${row.customer_name} booked ${row.service_type}`
      : `${row.customer_name} placed a ${row.category} order`,
  time: formatTimestamp(row.created_at),
  read: row.is_read,
  status: row.is_read ? 'accepted' : 'pending',
  createdAt: row.created_at,
});

const mapScheduleItem = (row) => ({
  id: row.booking_id,
  type: row.service_type,
  petName: row.pet_info?.name || 'N/A',
  petType: row.pet_info?.type || 'Pet',
  breed: row.pet_info?.breed || 'Unknown',
  service: row.service_type,
  owner: row.customer_name,
  contact: row.contact_info?.phone || '',
  email: row.contact_info?.email || '',
  time: row.appointment_info?.time || toLocaleTime(row.appointment_time),
  date: row.appointment_info?.date || row.appointment_date,
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

async function getNotifications() {
  const [bookingResult, orderResult] = await Promise.all([
    supabaseAdmin
      .from('booking_notifications')
      .select('booking_id, customer_name, service_type, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('order_notifications')
      .select('order_id, customer_name, category, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (bookingResult.error) throw bookingResult.error;
  if (orderResult.error) throw orderResult.error;

  const combined = [
    ...(bookingResult.data || []).map((row) => mapDashboardNotification(row, 'booking')),
    ...(orderResult.data || []).map((row) => mapDashboardNotification(row, 'order')),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const [bookingUnread, orderUnread] = await Promise.all([
    supabaseAdmin.from('booking_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabaseAdmin.from('order_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
  ]);

  if (bookingUnread.error) throw bookingUnread.error;
  if (orderUnread.error) throw orderUnread.error;

  return {
    notifications: combined,
    unreadCount: (bookingUnread.count || 0) + (orderUnread.count || 0),
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
      customersResult,
      bookingsResult,
      ordersResult,
      inventoryResult,
      reviewsResult,
    ] = await Promise.all([
      getNotifications(),
      supabaseAdmin.from('customers').select('customer_id, account_created', { count: 'exact' }),
      supabaseAdmin
        .from('bookings')
        .select('id, booking_id, customer_name, service_type, appointment_date, appointment_time, service_total, booking_status, pet_info, appointment_info, contact_info, grooming_summary, created_at, updated_at')
        .order('appointment_date', { ascending: true }),
      supabaseAdmin
        .from('orders')
        .select('id, order_id, customer_name, category, request_status, status, total, created_at, updated_at')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('inventory_items')
        .select('id, name, stock, updated_at')
        .order('stock', { ascending: true }),
      supabaseAdmin
        .from('reviews')
        .select('review_id, customer_name, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (customersResult.error) throw customersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (inventoryResult.error) throw inventoryResult.error;
    if (reviewsResult.error) throw reviewsResult.error;

    const customers = customersResult.data || [];
    const bookings = bookingsResult.data || [];
    const orders = ordersResult.data || [];
    const inventoryItems = inventoryResult.data || [];
    const reviews = reviewsResult.data || [];

    const currentMonthCustomers = customers.filter((customer) => {
      const date = normalizeDate(customer.account_created);
      return date && date >= currentMonthStart;
    }).length;
    const previousMonthCustomers = customers.filter((customer) => {
      const date = normalizeDate(customer.account_created);
      return date && date >= previousMonthStart && date < currentMonthStart;
    }).length;

    const customerGrowth = previousMonthCustomers > 0
      ? Math.round(((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100)
      : currentMonthCustomers > 0 ? 100 : 0;

    const todayBookings = bookings.filter((booking) => {
      const date = normalizeDate(booking.appointment_date);
      return date && date >= todayStart && date <= todayEnd && booking.booking_status !== 'Cancelled';
    });

    const pendingOrders = orders.filter((order) => order.request_status === 'Pending Request').length;

    const schedule = todayBookings
      .sort((a, b) => String(a.appointment_time || '').localeCompare(String(b.appointment_time || '')))
      .slice(0, 5)
      .map(mapScheduleItem);

    const alerts = [
      ...inventoryItems.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) < 10).slice(0, 3).map(buildLowStockAlert),
      ...bookings.filter((booking) => booking.booking_status === 'Pending Approval').slice(0, 2).map((row) => buildPendingAlert(row, 'booking')),
      ...orders.filter((order) => order.request_status === 'Pending Request').slice(0, 2).map((row) => buildPendingAlert(row, 'order')),
    ]
      .sort((a, b) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 5);

    const recentActivity = [
      ...orders
        .filter((order) => order.status === 'Delivered')
        .slice(0, 3)
        .map((order) => buildActivityItem('Order Completed', `${order.order_id} has been delivered`, order.updated_at || order.created_at, '✅')),
      ...bookings
        .filter((booking) => booking.booking_status === 'Completed')
        .slice(0, 3)
        .map((booking) => buildActivityItem('Booking Completed', `${booking.service_type} for ${booking.customer_name} is complete`, booking.updated_at || booking.created_at, '✅')),
      ...reviews
        .filter((review) => Number(review.rating || 0) >= 4)
        .slice(0, 3)
        .map((review) => buildActivityItem('Customer Feedback', `New ${review.rating}-star review from ${review.customer_name}`, review.created_at, '⭐')),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      ...notificationsData,
      stats: {
        totalCustomers: customers.length,
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
    const timestamp = new Date().toISOString();

    const [bookingUpdate, orderUpdate] = await Promise.all([
      supabaseAdmin
        .from('booking_notifications')
        .update({ is_read: true, updated_at: timestamp })
        .eq('is_read', false),
      supabaseAdmin
        .from('order_notifications')
        .update({ is_read: true, updated_at: timestamp })
        .eq('is_read', false),
    ]);

    if (bookingUpdate.error) throw bookingUpdate.error;
    if (orderUpdate.error) throw orderUpdate.error;

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
  const table = type === 'booking' ? 'booking_notifications' : type === 'order' ? 'order_notifications' : null;
  const field = type === 'booking' ? 'booking_id' : type === 'order' ? 'order_id' : null;

  if (!table || !field) {
    return res.status(400).json({ message: 'Invalid notification type.' });
  }

  try {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq(field, id)
      .eq('is_read', false);

    if (error) throw error;

    const notificationsData = await getNotifications();
    res.json(notificationsData);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update dashboard notification.' });
  }
});

export default router;
