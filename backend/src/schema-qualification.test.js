const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const serverSource = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

test('runtime order SQL never relies on the ambiguous search path', () => {
  const unqualifiedOrderPatterns = [
    /\bFROM\s+orders\b/i,
    /\bJOIN\s+orders\b/i,
    /\bINSERT\s+INTO\s+orders\b/i,
    /\bUPDATE\s+orders\b/i,
    /\bFROM\s+order_items\b/i,
    /\bJOIN\s+order_items\b/i,
    /\bINSERT\s+INTO\s+order_items\b/i,
    /hasTable\(['"](?:orders|order_items)['"]\)/,
    /(?:insertRow|updateRow|updateRowWithClient)\([^\n]*['"]orders['"]/,
  ];

  for (const pattern of unqualifiedOrderPatterns) {
    assert.equal(pattern.test(serverSource), false, `Found ambiguous order-table usage: ${pattern}`);
  }
});
