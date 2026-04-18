import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const PAYMENT_STATUS_OPTIONS = ['Pending', 'Paid', 'Refunded'];
const BOOKING_STATUS_OPTIONS = ['Pending Approval', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
const BOOKING_LIST_COLUMNS = [
  'id',
  'booking_code',
  'service_type',
  'service',
  'customer_name',
  'created_at',
  'scheduled_at',
  'appointment_date',
  'appointment_time',
  'service_total',
  'payment_method',
  'payment_status',
  'booking_status',
  'pet_info',
  'appointment_info',
  'contact_info',
  'grooming_summary',
  'total_price_history',
  'note',
].join(', ');
const BOOKING_DETAIL_COLUMNS = [
  BOOKING_LIST_COLUMNS,
  'service_details',
  'metadata',
].join(', ');

const CONFLICT_EXCLUDED_STATUSES = new Set(['cancelled', 'completed']);

async function markAdminBookingNotificationsRead(filters = {}) {
  let query = supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('audience', 'admin')
    .eq('type', 'booking')
    .eq('is_read', false);

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
    .eq('type', 'booking')
    .eq('is_read', false);

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  ({ error } = await query);
  if (error) throw error;
}

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

const formatConflictDateTime = (dateValue, timeValue) => {
  if (!dateValue && !timeValue) return 'the same schedule';
  if (!dateValue) return timeValue;
  if (!timeValue) {
    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime())
      ? dateValue
      : parsedDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const parsed = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(parsed.getTime())) {
    return `${dateValue} ${timeValue}`;
  }

  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const buildBookingSlotKey = (row) => {
  const dateValue = row.appointment_date || row.appointment_info?.date || row.scheduled_at?.slice(0, 10) || '';
  const timeValue = row.appointment_time || row.appointment_info?.time || '';

  if (!dateValue || !timeValue) return '';
  return `${dateValue}__${timeValue}`;
};

function buildBookingConflictMap(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    const status = String(row.booking_status || '').trim().toLowerCase();
    if (CONFLICT_EXCLUDED_STATUSES.has(status)) continue;

    const slotKey = buildBookingSlotKey(row);
    if (!slotKey) continue;

    const bucket = grouped.get(slotKey) || [];
    bucket.push(row);
    grouped.set(slotKey, bucket);
  }

  const conflictMap = new Map();

  for (const [slotKey, bucket] of grouped.entries()) {
    if (bucket.length < 2) continue;

    for (const row of bucket) {
      conflictMap.set(row.id, {
        slotKey,
        conflictCount: bucket.length,
        conflictingBookingIds: bucket.map((item) => item.id),
        conflictingBookingCodes: bucket.map((item) => item.booking_code),
      });
    }
  }

  return conflictMap;
}

function buildConflictNotifications(rows = [], conflictMap) {
  const grouped = new Map();

  for (const row of rows) {
    const conflict = conflictMap.get(row.id);
    if (!conflict) continue;

    if (!grouped.has(conflict.slotKey)) {
      grouped.set(conflict.slotKey, { row, conflict });
    }
  }

  return Array.from(grouped.values())
    .map(({ row, conflict }) => ({
      id: row.id,
      title: 'Schedule Conflict',
      message: `${conflict.conflictCount} bookings share ${formatConflictDateTime(
        row.appointment_date || row.appointment_info?.date || row.scheduled_at?.slice(0, 10) || '',
        row.appointment_time || row.appointment_info?.time || ''
      )}.`,
      time: new Date(row.created_at || row.updated_at || row.scheduled_at || Date.now()).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      read: false,
      status: 'conflict'
    }))
    .slice(0, 10);
}

const mapBooking = (row, conflict = null) => ({
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
  note: row.note || '',
  specialRequests: row.metadata?.specialRequests || row.service_details?.specialRequests || '',
  hasScheduleConflict: Boolean(conflict),
  scheduleConflictCount: Number(conflict?.conflictCount || 0),
  conflictingBookingIds: conflict?.conflictingBookingIds || [],
  conflictingBookingCodes: conflict?.conflictingBookingCodes || [],
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
      .select(BOOKING_LIST_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const conflictMap = buildBookingConflictMap(bookings || []);
    const conflictNotifications = buildConflictNotifications(bookings || [], conflictMap);

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      bookings: (bookings || []).map((row) => mapBooking(row, conflictMap.get(row.id))),
      notifications: [...conflictNotifications, ...notifications].slice(0, 10),
      unreadCount: unreadCount + conflictNotifications.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load bookings.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await findBookingByIdentifier(req.params.id, BOOKING_DETAIL_COLUMNS);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const conflictSeedRows = await supabaseAdmin
      .from('bookings')
      .select('id, booking_code, appointment_date, appointment_time, appointment_info, scheduled_at, booking_status')
      .order('created_at', { ascending: false });

    if (conflictSeedRows.error) throw conflictSeedRows.error;

    const conflictMap = buildBookingConflictMap(conflictSeedRows.data || []);
    res.json({
      booking: mapBooking(booking, conflictMap.get(booking.id)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load booking details.' });
  }
});

router.patch('/notifications/read-all', async (_req, res) => {
  try {
    await markAdminBookingNotificationsRead();

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
      .select('*')
      .single();

    if (updateError) throw updateError;

    const { data: allBookings, error: allBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (allBookingsError) throw allBookingsError;

    const conflictMap = buildBookingConflictMap(allBookings || []);
    const conflictNotifications = buildConflictNotifications(allBookings || [], conflictMap);

    if (bookingStatus !== 'Pending Approval') {
      try {
        await markAdminBookingNotificationsRead({ entityId: existingBooking.id });
      } catch (notificationError) {
        console.warn('Booking saved but notification state was not updated:', notificationError.message || notificationError);
      }
    }

    const [notifications, unreadCount] = await Promise.all([
      getRecentNotifications(),
      getUnreadCount()
    ]);

    res.json({
      booking: mapBooking(updatedBooking, conflictMap.get(updatedBooking.id)),
      notifications: [...conflictNotifications, ...notifications].slice(0, 10),
      unreadCount: unreadCount + conflictNotifications.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update booking.' });
  }
});

export default router;
