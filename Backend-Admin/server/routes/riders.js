import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const mapRider = (row) => ({
  riderId: row.rider_code,
  name: row.name,
  contact: row.contact,
  vehicle: row.vehicle,
  plateNumber: row.plate_number
});

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('riders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      riders: data.map(mapRider)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load riders.' });
  }
});

router.post('/', async (req, res) => {
  const { name, contact, vehicle, plateNumber } = req.body;

  try {
    const riderId = `RID-${Date.now().toString().slice(-6)}`;
    const { data, error } = await supabaseAdmin
      .from('riders')
      .insert({
        rider_code: riderId,
        name,
        contact,
        vehicle,
        plate_number: plateNumber
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({
      rider: mapRider(data)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save rider.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('riders')
      .delete()
      .eq('rider_code', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove rider.' });
  }
});

export default router;
