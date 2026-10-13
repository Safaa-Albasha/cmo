'use strict';
const fs = require('fs');
const path = require('path');
const { CmoError, writeJson, loadProject } = require('./io');
const { validate } = require('./validate');

// Write several JSON files, validate the whole project, restore everything if invalid.
function writeValidated(dir, files) {
  const backups = Object.keys(files).map((rel) => {
    const p = path.join(dir, rel);
    return { p, original: fs.existsSync(p) ? fs.readFileSync(p) : null };
  });
  for (const [rel, data] of Object.entries(files)) writeJson(dir, rel, data);
  const v = validate(loadProject(dir));
  if (!v.ok) {
    for (const b of backups) {
      if (b.original) fs.writeFileSync(b.p, b.original);
      else if (fs.existsSync(b.p)) fs.unlinkSync(b.p);
    }
    throw new CmoError('VALIDATION_FAILED', { count: v.errors.length }, null, v.errors);
  }
  return { files: Object.keys(files), warnings: v.warnings };
}

module.exports = { writeValidated };
