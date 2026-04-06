export const ADMIN_ROLE_OPTIONS = ['owner', 'staff'];

export function normalizeRole(value, allowedRoles = ADMIN_ROLE_OPTIONS) {
  const normalized = String(value || '').trim().toLowerCase();
  return allowedRoles.includes(normalized) ? normalized : null;
}

export function toDisplayRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function splitDisplayName(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

export function buildProfileName(profile, fallbackEmail = '') {
  const firstName = String(profile?.first_name || '').trim();
  const lastName = String(profile?.last_name || '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  if (fullName) return fullName;
  if (String(profile?.display_name || '').trim()) return String(profile.display_name).trim();
  if (String(profile?.email || '').trim()) return String(profile.email).trim().split('@')[0];
  if (String(fallbackEmail || '').trim()) return String(fallbackEmail).trim().split('@')[0];
  return 'Unnamed User';
}

export function formatJoinedDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}
