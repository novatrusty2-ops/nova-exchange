import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('static dashboards no longer publish fabricated reserves', () => {
  for (const name of ['pouchpay.html', 'novax.html', 'novaplus.html', 'index.html']) {
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    assert.equal(html.includes('100,000,000,000'), false, name);
    assert.equal(html.includes('50,000,000,000'), false, name);
    assert.equal(html.includes('25,000,000,000'), false, name);
    assert.equal(html.includes('FULLY ROUTED'), false, name);
    assert.equal(html.includes('SECURE & VERIFIED'), false, name);
  }
});
