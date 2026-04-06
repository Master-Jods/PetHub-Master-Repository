import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const BOOKING_STATUS_OPTIONS = ['Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const getAllowedPaymentMethods = (serviceType) => {
  if (serviceType === 'Birthday Party') return ['GCash'];
  if (serviceType === 'Grooming' || serviceType === 'Boarding') return ['Cash'];
  return ['Cash', 'GCash'];
};

const mergePetInfo = (row) => {
  const petInfo = row.pet_info || {};
  const metadata = row.metadata || {};
  const serviceDetails = row.service_details || {};

  return {
    ...petInfo,
    birthday: petInfo.birthday || metadata.petBirthday || serviceDetails.petBirthday || '',
    birthDate: petInfo.birthDate || metadata.petBirthday || serviceDetails.petBirthday || '',
    size: petInfo.size || metadata.petSize || serviceDetails.petSize || '',
    photoUrl: petInfo.photoUrl || metadata.petPhotoDataUrl || serviceDetails.petPhotoDataUrl || '',
    photoName: petInfo.photoName || metadata.petPhotoName || serviceDetails.petPhotoName || '',
  };
};

const mapNotification = (row) => ({
  id: row.metadata?.bookingCode || row.entity_id,
  title: row.title || 'New Booking',
  message: row.message || 'A new booking was submitted.',
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
  bookingId: row.booking_code,
  serviceType: row.service_type,
  customer: row.customer_name,
  appointmentDate: row.appointment_date || row.scheduled_at?.slice(0, 10) || null,
  appointmentTime: row.appointment_time || '',
  serviceTotal: Number(row.service_total || 0),
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  bookingStatus: row.booking_status,
  petInfo: mergePetInfo(row),
  appointmentInfo: row.appointment_info || {},
  contactInfo: row.contact_info || {},
  groomingSummary: row.grooming_summary || {},
  totalPriceHistory: row.total_price_history || [],
  paymentProof: row.metadata?.paymentProofDataUrl || row.service_details?.paymentProofDataUrl || '',
  paymentProofName: row.metadata?.paymentProofName || row.service_details?.paymentProofName || '',
});

async function findBookingByIdentifier(identifier, columns) {
  const bookingCodeResult = await supabaseAdmin
    .from('bookings')
    .select(columns)
    .eq('booking_code', identifier)
    .maybeSingle();

  if (bookingCodeResult.error) throw bookingCodeResult.error;
  if (bookingCodeResult.data) return bookingCodeResult.data;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
  if (!isUuid) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(columns)
    .eq('id', identifier)
    .maybeSingle();

    if (error) throw error;
  return data || null;
}

async function getRecentNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('entity_id, title, message, is_read, created_at, metadata')
    .eq('audience', 'admin')
    .eq('type', 'booking')
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
    .eq('type', 'booking')
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
        booking_code,
        service_type,
        customer_name,
        appointment_date,
        appointment_time,
        scheduled_at,
        service_total,
        payment_method,
        payment_status,
        booking_status,
        pet_info,
        appointment_info,
        contact_info,
        grooming_summary,
        total_price_history,
        service_details,
        metadata,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      bookings: (bookings || []).map(mapBooking),
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
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('audience', 'admin')
      .eq('type', 'booking')
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

  if (!PAYMENT_STATUS_OPTIONS.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  if (!BOOKING_STATUS_OPTIONS.includes(bookingStatus)) {
    return res.status(400).json({ message: 'Invalid booking status.' });
  }

  try {
    const existingBooking = await findBookingByIdentifier(
      id,
      'id, booking_code, service_type, payment_method, payment_status, booking_status, service_total, total_price_history, metadata, service_details'
    );

    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const nextPaymentMethod = paymentMethod ?? existingBooking.payment_method;
    const allowedPaymentMethods = getAllowedPaymentMethods(existingBooking.service_type);

    if (!allowedPaymentMethods.includes(nextPaymentMethod)) {
      return res.status(400).json({
        message: `${existingBooking.service_type} bookings only allow ${allowedPaymentMethods.join(' / ')} payment.`,
      });
    }

    const hasBirthdayProof = Boolean(
      existingBooking.metadata?.paymentProofDataUrl || existingBooking.service_details?.paymentProofDataUrl
    );
    if (
      existingBooking.service_type === 'Birthday Party'
      && paymentStatus === 'Paid'
      && !hasBirthdayProof
    ) {
      return res.status(400).json({ message: 'Birthday Party bookings need uploaded proof of payment before marking as paid.' });
    }

    const historyEntry = {
      amount: Number(serviceTotal ?? existingBooking.service_total),
      note: `Status update: method ${existingBooking.payment_method} -> ${nextPaymentMethod}, payment ${existingBooking.payment_status} -> ${paymentStatus}, booking ${existingBooking.booking_status} -> ${bookingStatus}`,
      loggedAt: new Date().toISOString()
    };

    const mergedHistory = [...(existingBooking.total_price_history || []), historyEntry];

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_method: nextPaymentMethod,
        payment_status: paymentStatus,
        booking_status: bookingStatus,
        service_total: Number(serviceTotal ?? existingBooking.service_total),
        total_price_history: mergedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBooking.id)
      .select(`
        id,
        booking_code,
        service_type,
        customer_name,
        appointment_date,
        appointment_time,
        scheduled_at,
        service_total,
        payment_method,
        payment_status,
        booking_status,
        pet_info,
        appointment_info,
        contact_info,
        grooming_summary,
        total_price_history,
        service_details,
        metadata
      `)
      .single();

    if (updateError) throw updateError;

    if (bookingStatus !== 'Pending Approval') {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('audience', 'admin')
        .eq('type', 'booking')
        .eq('entity_id', existingBooking.id)
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
