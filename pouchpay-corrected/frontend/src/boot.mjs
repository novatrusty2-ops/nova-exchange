import { createClient } from './client.mjs';
import { loadProductScreen, renderProduct } from './screens.mjs';

const PRODUCTS = ['pouchpay', 'nova-plus', 'nova-x'];

export async function mount(root, productId, client = createClient()) {
  root.innerHTML = '<p data-phase="loading">Loading balances…</p>';
  try {
    const screen = await loadProductScreen(productId, client);
    root.innerHTML = renderProduct(screen);
    return screen;
  } catch (error) {
    root.innerHTML = `<p data-phase="failure" data-error="render">${escapeHtml(error.message || 'failure')}</p>`;
    return null;
  }
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}

if (typeof document !== 'undefined') {
  const productId = document.body?.dataset?.product;
  const root = document.getElementById('app');
  if (root && PRODUCTS.includes(productId)) {
    const baseUrl = document.body.dataset.apiBase || '';
    mount(root, productId, createClient({ baseUrl }));
  }
}
