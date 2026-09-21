const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('forecast fallback returns predictions and insights when Python is unavailable', async () => {
  const context = {
    require: name => name === './dataCollectionService' ? {
      collectOrderData: async () => [{ ds: '2026-09-01', y: 2 }, { ds: '2026-09-02', y: 2 }],
      getDataStatistics: () => ({ avgOrdersPerDay: 2, standardDeviation: 1 })
    } : name === '../models/StoreSettings' ? { current: async () => ({ closedDays: [] }) } : require(name),
    console, module: { exports: {} }, __dirname, process, setTimeout, clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'forecastService.js'), 'utf8'), context);
  vm.runInContext('runProphetForecast = async () => { throw new Error("Python unavailable"); }', context);
  const result = await context.module.exports.generateForecast(3, 7);
  assert.equal(result.status, 'success');
  assert.equal(result.forecast.length, 3);
  assert.ok(result.insights.length > 0);
});
