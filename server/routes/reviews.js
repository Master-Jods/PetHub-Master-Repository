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
  showToCommunity: Boolean(row.show_to_community),
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
        show_to_community,
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
  const { adminResponse, showToCommunity } = req.body;
  const updateRow = {
    updated_at: new Date().toISOString()
  };

  if (adminResponse !== undefined) {
    updateRow.admin_response = adminResponse ?? '';
  }

  if (showToCommunity !== undefined) {
    updateRow.show_to_community = Boolean(showToCommunity);
    updateRow.community_featured_at = showToCommunity ? new Date().toISOString() : null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update(updateRow)
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
        show_to_community,
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
