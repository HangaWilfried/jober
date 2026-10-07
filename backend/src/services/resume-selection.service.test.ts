import assert from 'node:assert/strict';
import test from 'node:test';
import { selectMostRelevantResume } from './resume-selection.service.js';

test('selects the resume with the most relevant profile skills', () => {
  const selected = selectMostRelevantResume([
    { id: 'primary', isPrimary: true, extractedText: 'Java, Spring Boot, SQL' },
    { id: 'vue', isPrimary: false, extractedText: 'Vue.js TypeScript Node.js' }
  ], 'Senior Vue.js and TypeScript developer', ['Vue.js', 'TypeScript', 'Node.js']);

  assert.equal(selected?.id, 'vue');
});

test('prefers the primary usable resume when the job has no known profile skills', () => {
  const selected = selectMostRelevantResume([
    { id: 'other', isPrimary: false, extractedText: 'Aucune techno listée' },
    { id: 'primary', isPrimary: true, extractedText: 'Expérience en gestion' }
  ], 'Job description without known skills', ['Vue.js']);

  assert.equal(selected?.id, 'primary');
});

test('does not select a resume without extracted text when another is usable', () => {
  const selected = selectMostRelevantResume([
    { id: 'empty-primary', isPrimary: true, extractedText: null },
    { id: 'usable', isPrimary: false, extractedText: 'TypeScript Node.js' }
  ], 'TypeScript engineer', ['TypeScript']);

  assert.equal(selected?.id, 'usable');
});
