import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const asText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const asBoolean = (value, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on', 'active'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', 'inactive'].includes(normalized)) return false;
  }
  return fallback;
};

const asInteger = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : fallback;
};

const mapCampaign = (row) => ({
  id: row.id,
  title: row.title ?? '',
  subtitle: row.subtitle ?? '',
  description: row.description ?? '',
  campaignImageUrl: row.campaign_image_url ?? '',
  ctaText: row.cta_text ?? '',
  promoMechanic: row.promo_mechanic ?? '',
  targetSegment: row.target_segment ?? '',
  source: row.source ?? 'WOOF',
  isActive: Boolean(row.is_active),
  sortOrder: Number(row.sort_order ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeCampaignPayload = (payload = {}) => ({
  title: asText(payload.title),
  subtitle: asText(payload.subtitle),
  description: asText(payload.description),
  campaign_image_url: asText(payload.campaignImageUrl ?? payload.campaign_image_url),
  cta_text: asText(payload.ctaText ?? payload.cta_text),
  promo_mechanic: asText(payload.promoMechanic ?? payload.promo_mechanic),
  target_segment: asText(payload.targetSegment ?? payload.target_segment),
  source: asText(payload.source, 'WOOF') || 'WOOF',
  is_active: asBoolean(payload.isActive ?? payload.is_active, true),
  sort_order: asInteger(payload.sortOrder ?? payload.sort_order, 0),
});

router.post('/', async (req, res) => {
  const campaign = normalizeCampaignPayload(req.body);

  if (!campaign.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('pethub_campaigns')
    .insert(campaign)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ message: error.message || 'Failed to create campaign.' });
  }

  return res.status(201).json({ campaign: mapCampaign(data) });
});

export default router;
