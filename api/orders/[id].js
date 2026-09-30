const { db } = require('../../lib');
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { data, error } = await db().from('orders').select('order_id,status,total,payment,updated_at').eq('order_id', req.query.id).single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json({ orderId: data.order_id, status: data.status, total: data.total, payment: data.payment, updatedAt: data.updated_at });
};
