import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateReadinessScore } from './application-readiness.service.js';

test('readiness is 100 only when every required preparation item is complete', () => {
  assert.equal(calculateReadinessScore({
    hasResume: true,
    customizedResumeConfirmed: true,
    coverLetterConfirmed: true,
    unresolvedBlockerCount: 0
  }), 100);
});

test('missing or unconfirmed information prevents full readiness', () => {
  assert.equal(calculateReadinessScore({
    hasResume: false,
    customizedResumeConfirmed: true,
    coverLetterConfirmed: true,
    unresolvedBlockerCount: 0
  }), 70);
  assert.equal(calculateReadinessScore({
    hasResume: true,
    customizedResumeConfirmed: true,
    coverLetterConfirmed: true,
    unresolvedBlockerCount: 1
  }), 80);
});
