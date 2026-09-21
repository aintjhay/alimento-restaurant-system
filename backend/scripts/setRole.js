require('dotenv').config();
const mongoose = require('mongoose');
async function run() {
  const [email, role] = process.argv.slice(2);
  if (!email || !['customer', 'admin', 'cashier', 'kitchen', 'staff'].includes(role)) throw new Error('Usage: node scripts/setRole.js EMAIL customer|admin|cashier|kitchen|staff');
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await require('../src/models/User').findOneAndUpdate({ email: email.trim().toLowerCase() }, { $set: { role }, $inc: { sessionVersion: 1 } }, { new: true, runValidators: true });
  if (!user) throw new Error('Register the account first. No account was changed.');
  console.log(`Role updated to ${role}; previous sessions revoked.`);
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
