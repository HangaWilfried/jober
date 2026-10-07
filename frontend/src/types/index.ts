export interface JobAnalysis {
  matchScore: number;
  summary: string;
  requiredSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  minExperienceYears: number;
  analysisMethod: 'gemini' | 'local_fallback';
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  remoteType: 'full' | 'hybrid' | 'on-site' | 'unknown';
  url: string;
  source: string;
  description: string;
  publishedAt: string | null;
  expiresAt: string | null;
  status: 'new' | 'analyzed' | 'shortlisted' | 'rejected' | 'archived' | 'expired';
  analysis?: JobAnalysis;
  applicationId?: string;
  applicationStatus?: Application['status'];
}

export interface PreparedAnswer {
  question: string;
  suggestedAnswer: string;
  confidence: number;
  isConfirmed: boolean;
}

export interface ApplicationBlocker {
  id: string;
  type: 'subjective_question' | 'missing_document' | 'captcha' | 'salary_expectation' | 'other';
  question: string;
  resolved: boolean;
  userResponse: string | null;
}

export interface ResumeItem {
  id: string;
  name: string;
  isPrimary: boolean;
  updatedAt: string;
}

export interface ApplicationPreparedData {
  selectedResume?: ResumeItem;
  availableResumes: ResumeItem[];
  customizedResumeContent: string;
  customizedResumeConfirmed: boolean;
  customizedHighlights: string[];
  coverLetter: string;
  coverLetterConfirmed: boolean;
  preparedAnswers: PreparedAnswer[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status:
    | 'draft'
    | 'prepared'
    | 'ready_for_review'
    | 'ready_to_submit'
    | 'submitted_auto'
    | 'submitted_manual'
    | 'rejected';
  matchScore: number;
  readinessScore: number;
  preparedData: ApplicationPreparedData;
  blockers: ApplicationBlocker[];
  submittedAt: string | null;
}

export interface SearchPreferences {
  targetTitles: string[];
  remote: 'any' | 'hybrid' | 'full' | 'none';
  minSalary?: number;
  locations: string[];
  excludedCompanies?: string[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  location: string;
  skills: string[];
  searchPreferences: SearchPreferences;
  resumes: ResumeItem[];
}
