const assetUrlMap = import.meta.glob('../assets/*', { eager: true, import: 'default' });

export function assetUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:')) {
    return text;
  }

  const normalizedName = text
    .replace(/^\.?\/*src\/assets\//, '')
    .replace(/^\.?\/*assets\//, '')
    .replace(/^\.?\/*/, '');

  const matchedAssetPath = Object.keys(assetUrlMap).find((assetPath) => assetPath.endsWith(`/${normalizedName}`));
  return matchedAssetPath ? assetUrlMap[matchedAssetPath] : '';
}
