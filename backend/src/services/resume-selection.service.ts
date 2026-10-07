export interface ResumeCandidate {
  id: string;
  isPrimary: boolean;
  extractedText: string | null;
}

function normalizeText(value: string): string {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

export function selectMostRelevantResume(
  resumes: ResumeCandidate[],
  jobDescription: string,
  profileSkills: string[]
): ResumeCandidate | undefined {
  const usableResumes = resumes.filter((resume) => Boolean(resume.extractedText?.trim()));
  if (usableResumes.length === 0) {
    return resumes.find((resume) => resume.isPrimary) || resumes[0];
  }

  const normalizedDescription = normalizeText(jobDescription);
  const relevantSkills = profileSkills
    .map((skill) => ({ raw: skill, normalized: normalizeText(skill).trim() }))
    .filter((skill) => skill.normalized.length > 1 && normalizedDescription.includes(skill.normalized));
  if (relevantSkills.length === 0) {
    return usableResumes.find((resume) => resume.isPrimary) || usableResumes[0];
  }

  return usableResumes
    .map((resume) => {
      const cv = normalizeText(resume.extractedText || '');
      const matchingSkillCount = relevantSkills.filter((skill) => cv.includes(skill.normalized)).length;
      return {
        resume,
        matchingSkillCount,
        primaryRank: resume.isPrimary ? 1 : 0
      };
    })
    .sort((left, right) =>
      right.matchingSkillCount - left.matchingSkillCount ||
      right.primaryRank - left.primaryRank
    )[0]?.resume;
}
