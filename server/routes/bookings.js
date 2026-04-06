import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const PAYMENT_METHOD_OPTIONS = ['Cash', 'GCash'];
const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const BOOKING_STATUS_OPTIONS = ['Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const mapNotification = (row) => ({
  id: row.booking_id,
  title: 'New Booking',
  message: `${row.customer_name} booked ${row.service_type}`,
  time: new Date(row.created_at).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }),
  read: row.is_read,
  status: row.is_read ? 'accepted' : 'pending'
});

const mapBooking = (row) => ({
  id: row.id,
  bookingId: row.booking_id,
  serviceType: row.service_type,
  customer: row.customer_name,
  appointmentDate: row.appointment_date,
  appointmentTime: row.appointment_time,
  serviceTotal: row.service_total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  bookingStatus: row.booking_status,
  petInfo: row.pet_info,
  appointmentInfo: row.appointment_info,
  contactInfo: row.contact_info,
  groomingSummary: row.grooming_summary,
  totalPriceHistory: row.total_price_history || []
});

async function getRecentNotifications() {
  const { data, error } = await supabaseAdmin
    .from('booking_notifications')
    .select('booking_id, customer_name, service_type, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data.map(mapNotification);
}

async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from('booking_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

router.get('/', async (_req, res) => {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        booking_id,
        service_type,
        customer_name,
        appointment_date,
        appointment_time,
        service_total,
        payment_method,
        payment_status,
        booking_status,
        pet_info,
        appointment_info,
        contact_info,
        grooming_summary,
        total_price_history
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      bookings: bookings.map(mapBooking),
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load bookings.' });
  }
});

router.patch('/notifications/read-all', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('booking_notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('is_read', false);

    if (error) throw error;

    const notifications = await getRecentNotifications();
    res.json({
      notifications,
      unreadCount: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark notifications as read.' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, paymentStatus, bookingStatus, serviceTotal } = req.body;

  if (paymentMethod !== undefined && !PAYMENT_METHOD_OPTIONS.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }

  if (!PAYMENT_STATUS_OPTIONS.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  if (!BOOKING_STATUS_OPTIONS.includes(bookingStatus)) {
    return res.status(400).json({ message: 'Invalid booking status.' });
  }

  try {
    const { data: existingBooking, error: existingError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_id, payment_method, payment_status, booking_status, service_total, total_price_history')
      .eq('id', id)
      .single();

    if (existingError) throw existingError;
    if (!PAYMENT_METHOD_OPTIONS.includes(existingBooking.payment_method)) {
      throw new Error('Invalid payment method stored for this booking.');
    }

    const historyEntry = {
      amount: Number(serviceTotal ?? existingBooking.service_total),
      note: `Status update: method ${existingBooking.payment_method} -> ${paymentMethod ?? existingBooking.payment_method}, payment ${existingBooking.payment_status} -> ${paymentStatus}, booking ${existingBooking.booking_status} -> ${bookingStatus}`,
      loggedAt: new Date().toISOString()
    };

    const mergedHistory = [...(existingBooking.total_price_history || []), historyEntry];

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_method: paymentMethod ?? existingBooking.payment_method,
        payment_status: paymentStatus,
        booking_status: bookingStatus,
        service_total: Number(serviceTotal ?? existingBooking.service_total),
        total_price_history: mergedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        booking_id,
        service_type,
        customer_name,
        appointment_date,
        appointment_time,
        service_total,
        payment_method,
        payment_status,
        booking_status,
        pet_info,
        appointment_info,
        contact_info,
        grooming_summary,
        total_price_history
      `)
      .single();

    if (updateError) throw updateError;

    if (bookingStatus !== 'Pending Approval') {
      const { error: notificationError } = await supabaseAdmin
        .from('booking_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('booking_id', existingBooking.booking_id)
        .eq('is_read', false);

      if (notificationError) throw notificationError;
    }

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      booking: mapBooking(updatedBooking),
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update booking.' });
  }
});

export default router;
