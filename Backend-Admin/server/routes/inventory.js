import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();
const inventoryImageBucket = process.env.SUPABASE_INVENTORY_BUCKET || 'inventory-images';

const normalizeVariation = (variation) => ({
  id: variation?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: variation?.name ?? '',
  price: Number(variation?.price ?? 0),
});

const slugify = (value) =>
  String(value ?? 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'product';

const parseDataUrl = (value) => {
  if (!value?.startsWith('data:')) return null;
  const match = value.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const uploadInventoryImage = async (image, productName) => {
  const parsed = parseDataUrl(image);
  if (!parsed) return image ?? '';

  const extension = parsed.contentType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
  const filePath = `products/${slugify(productName)}-${Date.now()}.${extension}`;
  const { error } = await supabaseAdmin.storage
    .from(inventoryImageBucket)
    .upload(filePath, parsed.buffer, {
      contentType: parsed.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error('Failed to upload inventory image.');
  }

  const { data } = supabaseAdmin.storage.from(inventoryImageBucket).getPublicUrl(filePath);
  return data.publicUrl;
};

const normalizeProductPayload = async (payload = {}) => ({
  product_type: payload.productType ?? 'Pet Shop',
  name: payload.name?.trim() ?? '',
  category: payload.category?.trim() ?? '',
  pet_type: payload.petType ?? 'All Pets',
  price: Number(payload.price ?? 0),
  stock: Number(payload.stock ?? 0),
  brand: payload.brand?.trim() ?? '',
  description: payload.description?.trim() ?? '',
  image_url: await uploadInventoryImage(payload.image, payload.name),
  variations: Array.isArray(payload.variations)
    ? payload.variations
        .filter((variation) => variation?.name && variation?.price !== '' && variation?.price != null)
        .map(normalizeVariation)
    : [],
});

const isValidProduct = (product) =>
  product.name &&
  product.category &&
  product.pet_type &&
  Number.isFinite(product.price) &&
  product.price >= 0 &&
  Number.isFinite(product.stock) &&
  product.stock >= 0;

const mapProduct = (row) => ({
  id: row.id,
  productType: row.product_type,
  name: row.name,
  category: row.category,
  petType: row.pet_type,
  price: Number(row.price ?? 0),
  stock: Number(row.stock ?? 0),
  brand: row.brand ?? '',
  description: row.description ?? '',
  image: row.image_url ?? row.image ?? '',
  imagePath: row.image_url ?? row.image ?? '',
  variations: Array.isArray(row.variations) ? row.variations : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .select('*')
    .order('product_type', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch inventory.' });
  }

  return res.json({ products: data.map(mapProduct) });
});

router.post('/', async (req, res) => {
  let product;

  try {
    product = await normalizeProductPayload(req.body);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to prepare product.' });
  }

  if (!isValidProduct(product)) {
    return res.status(400).json({ error: 'Invalid product payload.' });
  }

  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .insert(product)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create product.' });
  }

  return res.status(201).json({ product: mapProduct(data) });
});

router.patch('/:id', async (req, res) => {
  let product;

  try {
    product = await normalizeProductPayload(req.body);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to prepare product.' });
  }

  if (!isValidProduct(product)) {
    return res.status(400).json({ error: 'Invalid product payload.' });
  }

  const { data, error } = await supabaseAdmin
    .from('inventory_items')
    .update(product)
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update product.' });
  }

  return res.json({ product: mapProduct(data) });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('inventory_items')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete product.' });
  }

  return res.status(204).send();
});

export default router;
