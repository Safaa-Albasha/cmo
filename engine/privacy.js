'use strict';
// Privacy rules enforced in code: pseudonymous keys, text scrubbing, small-group suppression.
const crypto = require('crypto');

function pseudonym(id, salt) {
  const h = crypto.createHash('sha256').update(`${salt}|${String(id).trim().toLowerCase()}`).digest('hex');
  return 'r_' + h.slice(0, 12);
}

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const URL = /https?:\/\/\S+/g;
const PHONE = /\+?[\d٠-٩][\d٠-٩\s-]{6,}[\d٠-٩]/g;

function scrub(text, names = []) {
  let s = String(text).replace(EMAIL, '[email]').replace(URL, '[link]').replace(PHONE, '[phone]');
  for (const n of names) if (n && String(n).trim().length > 2) s = s.split(String(n).trim()).join('[name]');
  return s;
}

const isSuppressed = (n, min) => n < min;

module.exports = { pseudonym, scrub, isSuppressed };
