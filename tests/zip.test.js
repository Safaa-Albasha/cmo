'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { crc32, createZip, unzip } = require('../engine/zip');

test('crc32 check value', () => {
  assert.strictEqual(crc32(Buffer.from('123456789')), 0xcbf43926);
});

test('zip round trip with UTF-8 names and content', () => {
  const buf = createZip({ 'a.txt': 'hello', 'مجلد/ب.xml': '<x>عربي</x>', 'bin.dat': Buffer.from([0, 1, 2]) });
  const files = unzip(buf);
  assert.deepStrictEqual(Object.keys(files), ['a.txt', 'مجلد/ب.xml', 'bin.dat']);
  assert.strictEqual(files['مجلد/ب.xml'].toString('utf8'), '<x>عربي</x>');
  assert.deepStrictEqual([...files['bin.dat']], [0, 1, 2]);
});

test('unzip rejects non-zip data', () => {
  assert.throws(() => unzip(Buffer.from('not a zip at all, definitely not')), (e) => e.code === 'IMPORT_FORMAT');
});
