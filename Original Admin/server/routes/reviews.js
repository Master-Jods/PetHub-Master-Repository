import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const mapReview = (row) => ({
  reviewId: row.review_id,
  customerName: row.customer_name,
  service: row.service,
  category: row.category,
  rating: row.rating,
  score: row.score,
  date: row.review_date,
  petName: row.pet_name,
  review: row.review_text,
  adminResponse: row.admin_response,
  wouldRecommend: row.would_recommend,
  transaction: row.transaction || {}
});

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        review_id,
        customer_name,
        service,
        category,
        rating,
        score,
        review_date,
        pet_name,
        review_text,
        admin_response,
        would_recommend,
        transaction
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      reviews: data.map(mapReview)
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
      .eq('review_id', id)
      .select(`
        review_id,
        customer_name,
        service,
        category,
        rating,
        score,
        review_date,
        pet_name,
        review_text,
        admin_response,
        would_recommend,
        transaction
      `)
      .single();

    if (error) throw error;

    res.json({
      review: mapReview(data)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update review.' });
  }
});

export default router;
