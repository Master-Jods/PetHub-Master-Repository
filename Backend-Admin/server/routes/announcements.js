import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const mapAnnouncement = (row) => ({
  id: row.id,
  category: row.category ?? 'Announcement',
  tag: row.tag ?? '',
  meta: row.meta ?? '',
  title: row.title ?? '',
  description: row.description ?? '',
  note: row.note ?? '',
  highlight: row.highlight ?? '',
  footer: row.footer ?? '',
  sortOrder: Number(row.sort_order ?? 0),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeAnnouncementPayload = (payload = {}) => ({
  category: String(payload.category ?? 'Announcement').trim() || 'Announcement',
  tag: String(payload.tag ?? '').trim(),
  meta: String(payload.meta ?? '').trim(),
  title: String(payload.title ?? '').trim(),
  description: String(payload.description ?? '').trim(),
  note: String(payload.note ?? '').trim(),
  highlight: String(payload.highlight ?? '').trim(),
  footer: String(payload.footer ?? '').trim(),
  sort_order: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
  is_active: payload.isActive !== false,
});

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message || 'Failed to load announcements.' });
  }

  return res.json({ announcements: (data || []).map(mapAnnouncement) });
});

router.post('/', async (req, res) => {
  const announcement = normalizeAnnouncementPayload(req.body);

  if (!announcement.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert(announcement)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message || 'Failed to create announcement.' });
  }

  return res.status(201).json({ announcement: mapAnnouncement(data) });
});

router.patch('/:id', async (req, res) => {
  const announcement = normalizeAnnouncementPayload(req.body);

  if (!announcement.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .update(announcement)
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message || 'Failed to update announcement.' });
  }

  return res.json({ announcement: mapAnnouncement(data) });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete announcement.' });
  }

  return res.status(204).send();
});

export default router;
