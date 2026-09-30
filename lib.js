const fs = require('fs');
const path = require('path');

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/* -------------------------------------------------------
   Supabase REST
------------------------------------------------------- */

async function supabase(pathname, options = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '');
  const key = env('SUPABASE_SECRET_KEY');

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const r = await fetch(`${base}/rest/v1/${pathname}`, {
    ...options,
    headers
  });

  const text = await r.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!r.ok) {
    const message =
      data?.message ||
      data?.error_description ||
      data?.hint ||
      'Supabase request failed';

    const e = new Error(message);
    e.status = r.status;
    throw e;
  }

  return data;
}

/* -------------------------------------------------------
   DB compatibility layer
   Allows existing API files to use db().from(...)
------------------------------------------------------- */

function db() {
  return {
    from(table) {
      return new QueryBuilder(table);
    }
  };
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.method = 'GET';
    this.body = null;
    this.filters = [];
    this.selectFields = '*';
    this.isSingle = false;
    this.orderBy = null;
    this.orderAscending = true;
    this.limitValue = null;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.body = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.filters.push(
      `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`
    );
    return this;
  }

  order(column, options = {}) {
    this.orderBy = column;
    this.orderAscending = options.ascending !== false;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    try {
      let pathname = this.table;

      const params = [];

      if (this.method === 'GET' || this.method === 'DELETE') {
        params.push(`select=${encodeURIComponent(this.selectFields)}`);
      }

      if (this.filters.length) {
        params.push(...this.filters);
      }

      if (this.orderBy) {
        params.push(
          `order=${encodeURIComponent(this.orderBy)}.${this.orderAscending ? 'asc' : 'desc'}`
        );
      }

      if (this.limitValue) {
        params.push(`limit=${encodeURIComponent(this.limitValue)}`);
      }

      if (params.length) {
        pathname += `?${params.join('&')}`;
      }

      const options = {
        method: this.method,
        headers: {}
      };

      if (this.method === 'POST') {
        options.headers.Prefer = 'return=representation';
        options.body = JSON.stringify(this.body);
      }

      if (this.method === 'PATCH') {
        options.headers.Prefer = 'return=representation';
        options.body = JSON.stringify(this.body);
      }

      const data = await supabase(pathname, options);

      let result = data;

      if (this.isSingle) {
        if (!Array.isArray(data) || !data.length) {
          return {
            data: null,
            error: {
              message: 'No rows found'
            }
          };
        }

        result = data[0];
      }

      return {
        data: result,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error
      };
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

/* -------------------------------------------------------
   Menu / helpers
------------------------------------------------------- */

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

/* -------------------------------------------------------
   WhatsApp notification
------------------------------------------------------- */

async function notifyWhatsApp(o) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.ADMIN_WHATSAPP || '917397964842';

  if (!token || !phoneId) return;

  const lines = (o.items || [])
    .map(
      i => `• ${i.name} × ${i.qty} = ₹${i.price * i.qty}`
    )
    .join('\n');

  const text =
    `🔔 NEW ORDER ${o.order_id}\n\n` +
    `${o.customer_name} | ${o.customer_phone}\n\n` +
    `${lines}\n\n` +
    `TOTAL: ₹${o.total}\n` +
    `Payment: ${o.payment}\n` +
    `Location: ${o.customer_location}` +
    `${o.note ? `\nNote: ${o.note}` : ''}`;

  try {
    await fetch(
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
  } catch (e) {
    console.error(
      'WhatsApp notification failed',
      e
    );
  }
}

module.exports = {
  db,
  supabase,
  menu,
  money,
  validPhone,
  adminOk,
  notifyWhatsApp
};
