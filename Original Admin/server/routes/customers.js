import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const mapCustomer = (row) => ({
  customerId: row.customer_id,
  name: row.name,
  contact: row.contact,
  email: row.email,
  status: row.status,
  loyaltyPoints: row.loyalty_points,
  accountCreated: row.account_created,
  lastActive: row.last_active,
  totalOrders: row.total_orders,
  totalSpent: row.total_spent,
  pets: row.pets || [],
  recentOrders: row.recent_orders || []
});

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select(`
        customer_id,
        name,
        contact,
        email,
        status,
        loyalty_points,
        account_created,
        last_active,
        total_orders,
        total_spent,
        pets,
        recent_orders
      `)
      .order('account_created', { ascending: false });

    if (error) throw error;

    res.json({
      customers: data.map(mapCustomer)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to load customers.'
    });
  }
});

export default router;
