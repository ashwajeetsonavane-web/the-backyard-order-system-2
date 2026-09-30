const { db, menu, validPhone, notifyWhatsApp } = require('../lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { customer, items, payment, note } = req.body || {};
    if (!customer?.name || !validPhone(customer.phone) || !customer.location || !Array.isArray(items) || !items.length || !['UPI','COD'].includes(payment))
      return res.status(400).json({ error: 'Please complete all required fields.' });
    const m = menu();
    const clean = items.map(i => {
      const x = m.find(v => v.name === i.name); const q = Math.max(1, Math.min(20, parseInt(i.qty)));
      if (!x || !q) throw new Error('Invalid item'); return { name: x.name, price: x.price, qty: q };
    });
    const total = Math.round(clean.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    const d = db();
    const { data, error } = await d.from('orders').insert({
      order_id: `TB${Date.now().toString().slice(-8)}`,
      customer_name: String(customer.name).slice(0,80), customer_phone: String(customer.phone),
      customer_location: String(customer.location).slice(0,500), items: clean, payment,
      note: String(note || '').slice(0,300), total, status: 'NEW'
    }).select('*').single();
    if (error) throw error;
    notifyWhatsApp(data).catch(console.error);
    res.json({ orderId: data.order_id, total: data.total });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not place order. Please try again.' }); }
};
