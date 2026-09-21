require('dotenv').config();
const { connectDB } = require('./src/config/mongodb');
const User = require('./src/models/User');
const { hashPassword } = require('./src/utils/authUtils');

async function migrateAdminRoles() {
  await connectDB();
  const result = await User.updateMany({ role: { $exists: false } }, { $set: { role: 'customer' } });
  console.log(`Assigned the customer role to ${result.modifiedCount} existing users.`);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email) {
    console.log('Set ADMIN_EMAIL to promote an existing user. Set ADMIN_PASSWORD too to create one.');
    return;
  }

  let admin = await User.findOne({ email }).select('+sessionVersion');
  if (!admin) {
    if (!password || password.length < 8) {
      throw new Error('ADMIN_PASSWORD with at least 8 characters is required to create an administrator.');
    }
    admin = new User({
      firstName: process.env.ADMIN_FIRST_NAME || 'Alimento',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
      email,
      passwordHash: await hashPassword(password),
      role: 'admin'
    });
  } else {
    admin.role = 'admin';
    if (password && password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
    if (password) admin.passwordHash = await hashPassword(password);
    admin.sessionVersion = (admin.sessionVersion || 0) + 1;
  }
  await admin.save();
  console.log(`Administrator ready: ${admin.email}`);
}

migrateAdminRoles()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
