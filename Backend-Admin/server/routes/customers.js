import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { buildProfileName } from '../lib/profileHelpers.js';

const router = Router();

const CUSTOMER_PROFILE_COLUMNS = [
  'user_id',
  'email',
  'first_name',
  'last_name',
  'display_name',
  'phone',
  'status',
  'created_at',
].join(', ');
const CUSTOMER_PET_COLUMNS = 'user_id, name, species, breed';
const CUSTOMER_ORDER_COLUMNS = 'user_id, order_code, status, total, order_date, created_at';
const CUSTOMER_BOOKING_COLUMNS = 'user_id, scheduled_at, created_at';

const mapCustomer = (profile, pets = [], orders = [], lastActive = null) => ({
  customerId: profile.user_id,
  name: buildProfileName(profile),
  contact: profile.phone || '',
  email: profile.email || '',
  status: String(profile.status || 'active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
  accountCreated: profile.created_at,
  lastActive,
  totalOrders: orders.length,
  totalSpent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
  pets: pets.map((pet) => ({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
  })),
  recentOrders: orders
    .slice()
    .sort((a, b) => new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0))
    .slice(0, 5)
    .map((order) => ({
      id: order.order_code,
      orderCode: order.order_code,
      status: order.status,
      amount: Number(order.total || 0),
      total: Number(order.total || 0),
      date: order.order_date,
      orderDate: order.order_date,
    })),
});

router.get('/', async (_req, res) => {
  try {
    const [profilesResult, petsResult, ordersResult, bookingsResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select(CUSTOMER_PROFILE_COLUMNS)
        .eq('role', 'customer')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('pets')
        .select(CUSTOMER_PET_COLUMNS),
      supabaseAdmin
        .from('orders')
        .select(CUSTOMER_ORDER_COLUMNS),
      supabaseAdmin
        .from('bookings')
        .select(CUSTOMER_BOOKING_COLUMNS),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (petsResult.error) throw petsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;

    const petsByUserId = new Map();
    for (const pet of petsResult.data || []) {
      const bucket = petsByUserId.get(pet.user_id) || [];
      bucket.push(pet);
      petsByUserId.set(pet.user_id, bucket);
    }

    const ordersByUserId = new Map();
    for (const order of ordersResult.data || []) {
      const bucket = ordersByUserId.get(order.user_id) || [];
      bucket.push(order);
      ordersByUserId.set(order.user_id, bucket);
    }

    const lastActivityByUserId = new Map();
    for (const row of [...(ordersResult.data || []), ...(bookingsResult.data || [])]) {
      const userId = row.user_id;
      const candidate = row.order_date || row.scheduled_at || row.created_at;
      const current = lastActivityByUserId.get(userId);
      if (!current || new Date(candidate) > new Date(current)) {
        lastActivityByUserId.set(userId, candidate);
      }
    }

    res.json({
      customers: (profilesResult.data || []).map((profile) =>
        mapCustomer(
          profile,
          petsByUserId.get(profile.user_id) || [],
          ordersByUserId.get(profile.user_id) || [],
          lastActivityByUserId.get(profile.user_id) || null
        )
      ),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to load customers.'
    });
  }
});

export default router;
