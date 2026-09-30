const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are missing.');
  return createClient(url, key, { auth: { persistSession: false } });
}
function menu() { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'menu.json'), 'utf8')); }
function validPhone(p) { return /^[0-9]{10}$/.test(String(p || '')); }
function admin(req) { return req.headers['x-admin-key'] === process.env.ADMIN_KEY; }
async function notifyWhatsApp(o) {
  const token = process.env.WHATSAPP_TOKEN, phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;
  const to = process.env.ADMIN_WHATSAPP || '917397964842';
  const lines = o.items.map(i => `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`).join('\n');
  const text = `🔔 NEW ORDER ${o.order_id}\n\n${o.customer_name} | ${o.customer_phone}\n\n${lines}\n\nTOTAL: ₹${o.total}\nPayment: ${o.payment}\nLocation: ${o.customer_location}${o.note ? `\nNote: ${o.note}` : ''}`;
  await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
  });
}
module.exports = { db, menu, validPhone, admin, notifyWhatsApp };
