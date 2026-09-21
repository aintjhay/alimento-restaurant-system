// Disposable development database; never connects to the production database.
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
async function run() {
  if (process.env.NODE_ENV === 'production') throw new Error('In-memory mode is development only.');
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  const database = await MongoMemoryReplSet.create({ binary: { version: '7.0.14', downloadDir: path.join(__dirname, 'mongodb-binaries') }, replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = database.getUri();
  const server = await require('./server').start();
  const Menu = require('./src/models/MenuItem');
  await Menu.insertMany(require('./src/data/completeMenu'));
  await require('./src/services/syncProductCategories')();
  if (process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD) {
    const { hashPassword } = require('./src/utils/authUtils');
    await require('./src/models/User').create({ email: process.env.DEV_ADMIN_EMAIL, passwordHash: await hashPassword(process.env.DEV_ADMIN_PASSWORD), firstName: 'Development', lastName: 'Admin', role: 'admin' });
  }
  const close = () => server.close(async () => { await require('mongoose').disconnect(); await database.stop(); process.exit(0); });
  process.on('SIGINT', close); process.on('SIGTERM', close);
  console.log('Disposable development database ready. Data is lost on shutdown.');
}
run().catch(error => { console.error(error.message); process.exit(1); });
