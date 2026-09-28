'use strict';

const DEFINITIONS = {
  PROJECT: {
    labels: ['Protocol-Version', 'Project-ID', 'Logical-Name'],
    sections: ['Objective', 'Invariants', 'Durable Scope Boundaries', 'Non-Goals'],
    excluded: ['Current Verified Baseline', 'Blockers', 'Evidence References', 'Exact Next Action'],
  },
  STATUS: {
    labels: ['Protocol-Version', 'Project-ID', 'Lifecycle-Status', 'Active-Task-ID', 'Last-Verified-At', 'Evidence-Class'],
    sections: ['Current Verified Baseline', 'Blockers', 'Evidence References', 'Exact Next Action'],
    excluded: ['Objective', 'Invariants', 'Durable Scope Boundaries', 'Non-Goals'],
  },
};
const PROJECT_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const TASK_ID = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function parseMetadata(text, kind) {
  const definition = DEFINITIONS[kind];
  if (!definition) throw new Error('METADATA_KIND_INVALID');
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const issues = [];
  const values = {};
  if (text.replace(/\r\n/g, '').includes('\r')) issues.push('LINE_ENDING_INVALID');
  if (!/^# [^\n]+$/.test(lines[0])) issues.push('H1_INVALID');
  let index = lines[1] === '' ? 2 : 1; // Both published templates and compact V2 headers are accepted.
  for (const label of definition.labels) {
    const line = lines[index++] || '';
    const prefix = `${label}: `;
    if (!line.startsWith(prefix) || !line.slice(prefix.length) || line.slice(prefix.length).trim() !== line.slice(prefix.length)) {
      issues.push(`REQUIRED_${label.toUpperCase().replace(/-/g, '_')}_INVALID`);
    } else {
      values[label] = line.slice(prefix.length);
    }
  }
  for (const label of definition.labels) {
    const exact = lines.filter(line => line.startsWith(`${label}:`)).length;
    if (exact > 1) issues.push(`DUPLICATE_${label.toUpperCase().replace(/-/g, '_')}`);
    const malformed = lines.some(line => new RegExp(`^\\s*(?:\\*\\*)?${label}(?:\\*\\*)?\\s*:`).test(line) && !line.startsWith(`${label}: `));
    if (malformed) issues.push(`FORMAT_${label.toUpperCase().replace(/-/g, '_')}`);
  }
  const sections = lines.filter(line => line.startsWith('## ')).map(line => line.slice(3));
  if (definition.sections.some(section => sections.filter(value => value === section).length !== 1)) issues.push('REQUIRED_SECTIONS_INVALID');
  if (definition.sections.filter(section => sections.includes(section)).join('|') !== definition.sections.join('|')) issues.push('SECTION_ORDER_INVALID');
  if (definition.excluded.some(section => sections.includes(section))) issues.push('ROLE_OVERLAP');
  if (values['Protocol-Version'] !== '2.0') issues.push('PROTOCOL_VERSION_INVALID');
  if (!PROJECT_ID.test(values['Project-ID'] || '')) issues.push('PROJECT_ID_INVALID');
  if (kind === 'PROJECT') {
    if (!values['Logical-Name']) issues.push('LOGICAL_NAME_INVALID');
    if (/^(?:Filesystem-Root|Project-Root|Physical-Root):\s*(?:[A-Za-z]:[\\/]|\\\\|\/)/im.test(text)) issues.push('PROJECT_ABSOLUTE_ROOT');
  } else {
    if (!['ACTIVE', 'PAUSED', 'BLOCKED', 'COMPLETE'].includes(values['Lifecycle-Status'])) issues.push('LIFECYCLE_STATUS_INVALID');
    if (values['Active-Task-ID'] !== 'NONE' && !TASK_ID.test(values['Active-Task-ID'] || '')) issues.push('ACTIVE_TASK_ID_INVALID');
    if (values['Last-Verified-At'] !== 'UNVERIFIED' && (!UTC.test(values['Last-Verified-At'] || '') || !Number.isFinite(Date.parse(values['Last-Verified-At'])))) issues.push('LAST_VERIFIED_AT_INVALID');
    if (!['OBSERVED', 'DOCUMENTED', 'INFERRED', 'UNVERIFIED'].includes(values['Evidence-Class'])) issues.push('EVIDENCE_CLASS_INVALID');
    if (values['Lifecycle-Status'] === 'ACTIVE') {
      const next = lines.slice(lines.indexOf('## Exact Next Action') + 1).join('\n').trim();
      if (!next || next === 'NONE') issues.push('ACTIVE_NEXT_ACTION_INVALID');
    }
  }
  return {values, issues: [...new Set(issues)], valid: issues.length === 0};
}

module.exports = {parseMetadata};
