// Local Windows development database only. Never reads a remote connection URI.
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
async function run() {
  const mode = process.argv[2];
  if (!['backup', 'init', 'verify'].includes(mode)) throw new Error('Use backup, init or verify');
  await mongoose.connect('mongodb://127.0.0.1:27017/alimento?directConnection=true', { serverSelectionTimeoutMS: 10000 });
  const admin = mongoose.connection.db.admin();
  if (mode === 'backup') {
    const directory = path.resolve(__dirname, '../../backup-artifacts/local-replica-' + new Date().toISOString().replace(/[:.]/g, '-'));
    const manifest = await require('./backup').backup(mongoose.connection, directory);
    console.log(`Backup complete: ${manifest.reduce((sum, c) => sum + c.count, 0)} documents. ${directory}`);
    fs.writeFileSync(path.join(__dirname, '../../backup-artifacts/local-replica-latest.txt'), directory);
  } else {
    let hello = await admin.command({ hello: 1 });
    if (mode === 'init' && !hello.setName) {
      try { await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] } }); }
      catch (error) { if (error.codeName !== 'AlreadyInitialized') throw error; }
    }
    for (let i = 0; i < 30; i++) {
      hello = await admin.command({ hello: 1 });
      if (hello.setName === 'rs0' && hello.isWritablePrimary) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (hello.setName !== 'rs0' || !hello.isWritablePrimary) throw new Error('Local replica set is not PRIMARY yet');
    const directory = fs.readFileSync(path.join(__dirname, '../../backup-artifacts/local-replica-latest.txt'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
    for (const entry of manifest) {
      const count = await mongoose.connection.db.collection(entry.name).countDocuments();
      if (count !== entry.count) throw new Error(`Collection count changed: ${entry.name}; review the backup before proceeding.`);
    }
    console.log(`rs0 is PRIMARY; all ${manifest.length} collection counts match the backup.`);
    if (mode === 'init') {
      const envPath = path.resolve(__dirname, '../.env');
      let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      const config = require('dotenv').parse(env);
      const uri = new URL(config.MONGODB_URI || 'mongodb://127.0.0.1:27017/alimento');
      if (!['localhost', '127.0.0.1'].includes(uri.hostname)) throw new Error('The application uses a non-local URI; it was not changed.');
      uri.hostname = '127.0.0.1';
      uri.searchParams.set('replicaSet', 'rs0');
      uri.searchParams.delete('directConnection');
      const line = 'MONGODB_URI=' + uri.toString();
      env = /^MONGODB_URI=.*$/m.test(env) ? env.replace(/^MONGODB_URI=.*$/m, line) : env + '\n' + line + '\n';
      fs.writeFileSync(envPath, env);
      console.log('Local application connection updated to rs0.');
    }
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
