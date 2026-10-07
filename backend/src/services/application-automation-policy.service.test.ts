import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAutomationBlocker,
  getConfirmedAnswer,
  isSensitiveOrLegalField,
  isSupportedApplicationUrl
} from './application-automation-policy.service.js';

test('supports only HTTPS-hosted Greenhouse and Lever application pages', () => {
  assert.equal(isSupportedApplicationUrl('https://boards.greenhouse.io/company/jobs/1'), true);
  assert.equal(isSupportedApplicationUrl('https://jobs.lever.co/company/abc'), true);
  assert.equal(isSupportedApplicationUrl('https://evil.example/redirect?to=jobs.lever.co'), false);
  assert.equal(isSupportedApplicationUrl('http://jobs.lever.co/company/abc'), false);
});

test('requires every explicit automation prerequisite', () => {
  const ready = {
    matchScore: 95,
    readinessScore: 100,
    unresolvedBlockerCount: 0,
    unconfirmedAnswerCount: 0,
    hasResumeFile: true,
    hasCustomizedResume: true,
    hasCoverLetter: true,
    alreadySubmitted: false
  };

  assert.equal(getAutomationBlocker(ready), null);
  assert.match(getAutomationBlocker({ ...ready, matchScore: 89 }) || '', /90 %/);
  assert.match(getAutomationBlocker({ ...ready, unresolvedBlockerCount: 1 }) || '', /humain/);
  assert.match(getAutomationBlocker({ ...ready, unconfirmedAnswerCount: 1 }) || '', /confirmées/);
});

test('never handles legal, sensitive or unconfirmed form answers automatically', () => {
  assert.equal(isSensitiveOrLegalField('Do you consent to our terms?'), true);
  assert.equal(isSensitiveOrLegalField('Email address'), false);
  assert.equal(getConfirmedAnswer('Why do you want to work here?', [
    { question: 'Why do you want to work here?', suggestedAnswer: 'Because...', isConfirmed: false }
  ]), undefined);
  assert.equal(getConfirmedAnswer('Why do you want to work here?', [
    { question: 'Why do you want to work here?', suggestedAnswer: 'Because...', isConfirmed: true }
  ]), 'Because...');
});
