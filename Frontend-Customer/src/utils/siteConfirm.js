export async function siteConfirm(message) {
  if (typeof window !== 'undefined' && typeof window.__siteConfirm === 'function') {
    return window.__siteConfirm(message);
  }

  return window.confirm(message);
}
