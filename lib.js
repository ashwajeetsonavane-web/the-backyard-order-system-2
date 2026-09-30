const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function db() {
  return createClient(
    env('SUPABASE_URL'),
    env('SUPABASE_SECRET_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

function menu() {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'menu.json'),
      'utf8'
    )
  );
}

function money(n) {
  return Math.round(Number(n) * 100) / 100;
}

function validPhone(p) {
  return /^[0-9]{10}$/.test(String(p || ''));
}

function adminOk(req) {
  return (
    req.headers['x-admin-key'] &&
    req.headers['x-admin-key'] === process.env.ADMIN_KEY
  );
}

async function notifyWhatsApp(o) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.ADMIN_WHATSAPP || '917397964842';

  if (!token || !phoneId) return;

  const lines = (o.items || [])
    .map(i => `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`)
    .join('\n');

  const text =
`🔔 NEW ORDER ${o.order_id}

${o.customer_name} | ${o.customer_phone}

${lines}

TOTAL: ₹${o.total}
Payment: ${o.payment}
Location: ${o.customer_location}${o.note ? `\nNote: ${o.note}` : ''}`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: text
          }
        })
      }
    );

    if (!response.ok) {
      console.error(
        'WhatsApp error:',
        await response.text()
      );
    }
  } catch (e) {
    console.error(
      'WhatsApp notification failed:',
      e
    );
  }
}

module.exports = {
  db,
  menu,
  money,
  validPhone,
  adminOk,
  notifyWhatsApp
};
