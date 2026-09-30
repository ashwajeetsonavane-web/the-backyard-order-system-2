const { db, admin } = require('../../../lib');
module.exports = async (req, res) => {
  if (!admin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { data, error } = await db().from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(o => ({ orderId:o.order_id, customer:{name:o.customer_name,phone:o.customer_phone,location:o.customer_location}, items:o.items, payment:o.payment, note:o.note, total:o.total, status:o.status, createdAt:o.created_at, updatedAt:o.updated_at })));
};
