// JSONL BSON backup for modest deployments. Put the API in maintenance mode first for cross-collection consistency.
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
const { EJSON } = mongoose.mongo.BSON;
async function backup(connection, directory) {
  fs.mkdirSync(directory, { recursive: true });
  const manifest = [];
  for (const { name } of await connection.db.listCollections({ name: { $not: /^system\./ } }).toArray()) {
    if (!/^[A-Za-z0-9_-]+$/.test(name)) throw new Error('Unsupported collection name');
    const collection = connection.db.collection(name);
    const file = path.join(directory, `${name}.jsonl`);
    const fd = fs.openSync(file, 'wx');
    let count = 0;
    try { for await (const doc of collection.find({})) { fs.writeSync(fd, EJSON.stringify(doc, { relaxed: false }) + '\n'); count++; } }
    finally { fs.closeSync(fd); }
    manifest.push({ name, count, indexes: await collection.indexes() });
  }
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  return manifest;
}
async function restore(connection, directory) {
  const existing = await connection.db.listCollections().toArray();
  if (existing.length) throw new Error('Restore target must be empty. Existing data will never be overwritten.');
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  for (const entry of manifest) {
    if (!/^[A-Za-z0-9_-]+$/.test(entry.name)) throw new Error('Invalid collection name');
    const collection = connection.db.collection(entry.name);
    const lines = require('node:readline').createInterface({ input: fs.createReadStream(path.join(directory, `${entry.name}.jsonl`)), crlfDelay: Infinity });
    let count = 0;
    for await (const line of lines) if (line) { await collection.insertOne(EJSON.parse(line)); count++; }
    if (count !== entry.count) throw new Error(`Count mismatch for ${entry.name}`);
    for (const index of entry.indexes) {
      if (index.name === '_id_') continue;
      const { key, v, ns, ...options } = index;
      await collection.createIndex(key, options);
    }
  }
  return manifest;
}
async function main() {
  const [mode, directory] = process.argv.slice(2);
  if (!['backup', 'restore'].includes(mode) || !directory) throw new Error('Usage: node scripts/backup.js backup|restore DIRECTORY');
  const uri = mode === 'restore' ? process.env.RESTORE_MONGODB_URI : process.env.MONGODB_URI;
  if (!uri) throw new Error('Set MONGODB_URI for backup or RESTORE_MONGODB_URI for an empty restore target');
  await mongoose.connect(uri);
  const result = await (mode === 'restore' ? restore : backup)(mongoose.connection, path.resolve(directory));
  console.log(`${mode} complete: ${result.reduce((sum, e) => sum + e.count, 0)} documents across ${result.length} collections.`);
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
module.exports = { backup, restore };
