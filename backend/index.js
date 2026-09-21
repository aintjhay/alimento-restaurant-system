// Compatibility entry point: all servers use the same authenticated API.
require('./server').start().catch(error => { console.error(error.message); process.exit(1); });
