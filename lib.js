const fs = require('fs');
const path = require('path');

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function supabase(pathname, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SECRET_KEY');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const r = await fetch(`${base}/rest/v1/${pathname}`, { ...options, headers });
  const text = await r.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const message = data?.message || data?.error_description || data?.hint || 'Supabase request failed';
    const e = new Error(message);
    e.status = r.status;
    throw e;
  }
  return data;
}

function menu() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'menu.json'), 'utf8'));
}

function money(n) { return Math.round(Number(n) * 100) / 100; }
function validPhone(p) { return /^[0-9]{10}$/.test(String(p || '')); }
function adminOk(req) { return req.headers['x-admin-key'] && req.headers['x-admin-key'] === process.env.ADMIN_KEY; }

async function notifyWhatsApp(o) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.ADMIN_WHATSAPP || '917397964842';
  if (!token || !phoneId) return;
  const lines = o.items.map(i => `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`).join('\n');
  const text = `🔔 NEW ORDER ${o.order_id}\n\n${o.customer_name} | ${o.phone}\n\n${lines}\n\nTOTAL: ₹${o.total}\nPayment: ${o.payment_method}\nLocation: ${o.location}${o.note ? `\nNote: ${o.note}` : ''}`;
  try {
    await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
    });
  } catch (e) { console.error('WhatsApp notification failed', e); }
}

module.exports = { supabase, menu, money, validPhone, adminOk, notifyWhatsApp };
