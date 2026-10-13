'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { pseudonym, scrub, isSuppressed } = require('../engine/privacy');

test('pseudonym is stable, salted and case-insensitive', () => {
  const a = pseudonym('Sara@Corp.com', 's1');
  assert.match(a, /^r_[0-9a-f]{12}$/);
  assert.strictEqual(a, pseudonym(' sara@corp.com ', 's1'));
  assert.notStrictEqual(a, pseudonym('sara@corp.com', 's2'));
});

test('scrub removes emails, phones, links and known names', () => {
  const s = scrub('كلم سارة على sara@corp.com أو +966 55 123 4567 أو ٠٥٥١٢٣٤٥٦٧ — https://x.y/z', ['سارة']);
  assert.strictEqual(s, 'كلم [name] على [email] أو [phone] أو [phone] — [link]');
});

test('suppression threshold', () => {
  assert.strictEqual(isSuppressed(4, 5), true);
  assert.strictEqual(isSuppressed(5, 5), false);
});
