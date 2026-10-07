export interface ReadinessInputs {
  hasResume: boolean;
  customizedResumeConfirmed: boolean;
  coverLetterConfirmed: boolean;
  unresolvedBlockerCount: number;
}

export function calculateReadinessScore(inputs: ReadinessInputs): number {
  return (inputs.hasResume ? 30 : 0) +
    (inputs.customizedResumeConfirmed ? 30 : 0) +
    (inputs.coverLetterConfirmed ? 20 : 0) +
    (inputs.unresolvedBlockerCount === 0 ? 20 : 0);
}
