import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { buildProfileName } from '../lib/profileHelpers.js';

const router = Router();

const buildTransaction = (row) => {
  const fallbackReference = row.booking?.booking_code || row.order?.order_code || row.review_code;

  if (row.transaction && Object.keys(row.transaction).length > 0) {
    return {
      reference: row.transaction.reference || fallbackReference || 'N/A',
      serviceName: row.transaction.serviceName || row.service || 'Service',
      bookedDate: row.transaction.bookedDate || row.booking?.scheduled_at || row.order?.order_date || row.review_date,
      time: row.transaction.time || row.booking?.scheduled_at || row.order?.order_date || '',
      paymentMethod: row.transaction.paymentMethod || row.booking?.payment_method || row.order?.payment_method || '',
      paymentStatus: row.transaction.paymentStatus || row.booking?.payment_status || row.order?.payment_status || '',
      total: row.transaction.total || row.booking?.service_total || row.order?.total || 0,
    };
  }

  return {
    reference: fallbackReference || 'N/A',
    serviceName: row.service || row.booking?.service || row.order?.category || 'Service',
    bookedDate: row.booking?.scheduled_at || row.order?.order_date || row.review_date || '',
    time: row.booking?.scheduled_at || row.order?.order_date || '',
    paymentMethod: row.booking?.payment_method || row.order?.payment_method || '',
    paymentStatus: row.booking?.payment_status || row.order?.payment_status || '',
    total: row.booking?.service_total || row.order?.total || 0,
  };
};

const mapReview = (row, profileMap) => ({
  reviewId: row.review_code,
  customerName: buildProfileName(profileMap.get(row.user_id) || {}, ''),
  service: row.service,
  category: row.category,
  rating: row.rating,
  score: row.score || `${row.rating}/5`,
  date: row.review_date,
  petName: row.pet_name,
  review: row.comment,
  adminResponse: row.admin_response || '',
  wouldRecommend: row.would_recommend,
  transaction: buildTransaction(row),
});

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        review_code,
        user_id,
        service,
        category,
        rating,
        score,
        review_date,
        pet_name,
        comment,
        admin_response,
        would_recommend,
        transaction,
        booking:bookings(booking_code, scheduled_at, payment_method, payment_status, service_total, service),
        order:orders(order_code, order_date, payment_method, payment_status, total, category)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean))];
    const profilesResult = userIds.length
      ? await supabaseAdmin
          .from('profiles')
          .select('user_id, email, first_name, last_name, display_name')
          .in('user_id', userIds)
      : { data: [], error: null };

    if (profilesResult.error) throw profilesResult.error;

    const profileMap = new Map((profilesResult.data || []).map((profile) => [profile.user_id, profile]));

    res.json({
      reviews: (data || []).map((row) => mapReview(row, profileMap))
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load reviews.' });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { adminResponse } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({
        admin_response: adminResponse ?? '',
        updated_at: new Date().toISOString()
      })
      .eq('review_code', id)
      .select(`
        id,
        review_code,
        user_id,
        service,
        category,
        rating,
        score,
        review_date,
        pet_name,
        comment,
        admin_response,
        would_recommend,
        transaction,
        booking:bookings(booking_code, scheduled_at, payment_method, payment_status, service_total, service),
        order:orders(order_code, order_date, payment_method, payment_status, total, category)
      `)
      .single();

    if (error) throw error;

    const profileResult = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, first_name, last_name, display_name')
      .eq('user_id', data.user_id)
      .maybeSingle();

    if (profileResult.error) throw profileResult.error;

    const profileMap = new Map(profileResult.data ? [[profileResult.data.user_id, profileResult.data]] : []);

    res.json({
      review: mapReview(data, profileMap)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update review.' });
  }
});

export default router;
