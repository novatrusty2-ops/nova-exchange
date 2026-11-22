/** Reservation display follows an authoritative expiry. It does not create one. */

export function reservationView(row, now = Date.now()) {
  if (!row || row.authoritative !== true) return { state: 'unavailable', expiresAt: null };
  const expiresAt = row.expiresAt ? Date.parse(row.expiresAt) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= now) return { state: 'expired', expiresAt: row.expiresAt };
  return { state: row.status === 'pending' ? 'pending' : 'unavailable', expiresAt: row.expiresAt || null };
}
