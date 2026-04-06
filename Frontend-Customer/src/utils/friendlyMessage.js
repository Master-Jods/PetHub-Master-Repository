const technicalPatterns = [
  /localhost/gi,
  /failed to/gi,
  /fetch/gi,
  /network error/gi,
  /status\s*\d+/gi,
  /http/gi,
  /api/gi,
  /supabase/gi,
  /unexpected token/gi,
  /column .* does not exist/gi,
  /relation .* does not exist/gi,
];

export function toFriendlyMessage(input, fallback = 'Something went wrong. Please try again.') {
  const raw = String(input ?? '').trim();
  if (!raw) return fallback;

  const normalized = raw.replace(/\s+/g, ' ').trim();
  if (technicalPatterns.some((pattern) => pattern.test(normalized))) {
    return fallback;
  }

  return normalized;
}
