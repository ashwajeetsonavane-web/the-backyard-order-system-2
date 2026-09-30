const { db, admin } = require('../../../lib');
module.exports = async (req, res) => {
  if (!admin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const allowed = ['ACCEPTED','PREPARING','READY','OUT_FOR_DELIVERY','COMPLETED','CANCELLED'];
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'Invalid status' });
  const { data, error } = await db().from('orders').update({ status:req.body.status, updated_at:new Date().toISOString() }).eq('order_id', req.query.id).select('*').single();
  if (error || !data) return res.status(404).json({ error:'Not found' });
  res.json({ orderId:data.order_id, status:data.status, updatedAt:data.updated_at });
};
