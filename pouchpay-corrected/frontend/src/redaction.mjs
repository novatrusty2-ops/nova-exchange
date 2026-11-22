const SECRET_KEYS = ['accountnumber', 'iban', 'routingnumber', 'swiftbic', 'privatekey', 'mnemonic', 'password', 'keystore', 'secret', 'authorization'];

export function redactIdentifier(value) {
  const text = value == null ? '' : String(value);
  if (text.length <= 4) return '••••';
  return `${text.slice(0, 2)}…${text.slice(-2)}`;
}

export function redactPayload(value) {
  if (Array.isArray(value)) return value.map(redactPayload);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEYS.includes(key.toLowerCase()) ? '[redacted]' : redactPayload(item);
  }
  return out;
}

export function bindWallet(session, payload) {
  const sessionAddress = session?.address ? String(session.address).toLowerCase() : null;
  const payloadAddress = payload?.address ? String(payload.address).toLowerCase() : null;
  if (sessionAddress && payloadAddress && sessionAddress !== payloadAddress) {
    return { ok: false, reason: 'address_mismatch', address: session.address };
  }
  return { ok: true, reason: null, address: session?.address ?? payload?.address ?? null };
}
