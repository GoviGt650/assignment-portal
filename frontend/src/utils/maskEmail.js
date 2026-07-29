export function maskEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value) return '';
  if (value.length <= 4) {
    return `${value.charAt(0)}${'*'.repeat(Math.max(value.length - 1, 1))}`;
  }
  const first = value.slice(0, 2);
  const last = value.slice(-2);
  const middle = '*'.repeat(value.length - 4);
  return `${first}${middle}${last}`;
}
