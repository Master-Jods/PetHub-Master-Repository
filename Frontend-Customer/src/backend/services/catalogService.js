const DEFAULT_API_ROOT = 'http://localhost:4000';

const CATEGORY_TO_SLUG = {
  'Pet Food & Treats': 'pet-food-treats',
  'Pet Grooming Supplies': 'pet-grooming-supplies',
  'Health & Wellness': 'health-wellness',
  'Litter & Toilet': 'litter-toilet',
  'Pet Accessories & Toys': 'pet-accessories-toys',
  'Pet Treats': 'pet-treats',
  'Frozen Treats': 'frozen-treats',
  'For Dogs': 'for-dogs',
  'For Cats': 'for-cats',
  All: 'all',
};

function normalizeApiRoot(value) {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  return raw.endsWith('/api') ? raw.slice(0, -4) : raw;
}

function buildApiCandidates() {
  const configuredRoot = normalizeApiRoot(import.meta.env.VITE_API_URL);
  const fallbackRoot = normalizeApiRoot(DEFAULT_API_ROOT);

  return [configuredRoot, fallbackRoot]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function toPetType(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('dog')) return 'dog';
  if (text.includes('cat')) return 'cat';
  return 'all';
}

function toImagePath(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:') || text.startsWith('/')) {
    return text;
  }
  return `/src/assets/${text}`;
}

function toVariantLabelKey(name) {
  const text = String(name || '').toLowerCase();
  if (text.includes('color')) return 'color';
  if (text.includes('size')) return 'size';
  if (text.includes('scent')) return 'scent';
  if (text.includes('type')) return 'type';
  return 'flavor';
}

function mapVariant(variation) {
  const label = String(variation?.name || '').trim();
  const key = toVariantLabelKey(label);

  return {
    id: variation?.id || crypto.randomUUID(),
    name: label,
    [key]: label,
    price: Number(variation?.price || 0),
  };
}

function getPriceLabel(basePrice, variants) {
  const prices = [Number(basePrice || 0), ...variants.map((variation) => Number(variation.price || 0))]
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!prices.length) {
    return '₱0.00';
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return `₱${minPrice.toFixed(2)}`;
  }

  return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
}

function mapCatalogProduct(row) {
  const variants = Array.isArray(row.variations) ? row.variations.map(mapVariant) : [];
  const basePrice = Number(row.price || 0);

  return {
    id: row.id,
    productType: row.productType,
    name: row.name,
    category: CATEGORY_TO_SLUG[row.category] || 'all',
    price: getPriceLabel(basePrice, variants),
    basePrice,
    petType: toPetType(row.petType),
    description: row.description || '',
    longDescription: row.description || '',
    image: toImagePath(row.image),
    hasVariants: variants.length > 0,
    variants,
    brand: row.brand || '',
    sold: Number(row.soldCount || 0),
    stock: Number(row.stock || 0),
    inStock: Number(row.stock || 0) > 0,
  };
}

async function requestCatalog(productType) {
  const candidates = buildApiCandidates();
  let lastError = null;

  for (const root of candidates) {
    try {
      const response = await fetch(
        `${root}/api/inventory/catalog?productType=${encodeURIComponent(productType)}`
      );

      if (!response.ok) {
        throw new Error('Catalog request failed.');
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to load catalog.');
}

export async function fetchCatalogProducts(productType) {
  const payload = await requestCatalog(productType);
  return Array.isArray(payload?.products) ? payload.products.map(mapCatalogProduct) : [];
}
