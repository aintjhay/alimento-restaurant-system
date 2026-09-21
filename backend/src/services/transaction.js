const mongoose = require('mongoose');
// Driver 5 returns commit metadata from withTransaction. Preserve the callback value explicitly.
async function transaction(work) {
  let result;
  await mongoose.connection.transaction(async session => { result = await work(session); });
  return result;
}
module.exports = transaction;
