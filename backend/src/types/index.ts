import { z } from 'zod';

// ========================
// 1. Profil Utilisateur
// ========================
export const SearchPreferencesSchema = z.object({
  targetTitles: z.array(z.string().trim().min(1)).default([]),
  remote: z.enum(['any', 'hybrid', 'full', 'none']).default('any'),
  minSalary: z.number().nonnegative().optional(),
  locations: z.array(z.string().trim().min(1)).default([]),
  excludedCompanies: z.array(z.string().trim().min(1)).default([])
});

export const UserProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  headline: z.string().trim().optional(),
  location: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  searchPreferences: SearchPreferencesSchema.optional()
}).strict();

export const ResumeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPrimary: z.boolean(),
  updatedAt: z.string()
});

export const UserProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  headline: z.string(),
  location: z.string(),
  skills: z.array(z.string()),
  searchPreferences: SearchPreferencesSchema,
  resumes: z.array(ResumeItemSchema)
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SearchPreferences = z.infer<typeof SearchPreferencesSchema>;
export type ResumeItem = z.infer<typeof ResumeItemSchema>;

// ========================
// 2. Offres d'Emploi
// ========================
export const JobAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary: z.string(),
  requiredSkills: z.array(z.string()),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  minExperienceYears: z.number(),
  analysisMethod: z.enum(['gemini', 'local_fallback'])
});

export const JobOfferSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remoteType: z.enum(['full', 'hybrid', 'on-site', 'unknown']),
  url: z.string().url(),
  source: z.string(),
  description: z.string(),
  publishedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  status: z.enum(['new', 'analyzed', 'shortlisted', 'rejected', 'archived', 'expired']),
  analysis: JobAnalysisSchema.optional(),
  applicationId: z.string().optional(),
  applicationStatus: z.enum([
    'draft',
    'prepared',
    'ready_for_review',
    'ready_to_submit',
    'submitted_auto',
    'submitted_manual',
    'rejected'
  ]).optional()
});

export const ManualJobInputSchema = z.object({
  title: z.string().trim().min(1),
  company: z.string().trim().min(1),
  location: z.string().trim().optional(),
  remoteType: z.enum(['full', 'hybrid', 'on-site', 'unknown']).optional(),
  url: z.string().url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol)),
  source: z.string().trim().min(1).optional(),
  description: z.string().trim().min(100)
}).strict();

export type JobOffer = z.infer<typeof JobOfferSchema>;
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;

// ========================
// 3. Candidatures
// ========================
export const PreparedAnswerSchema = z.object({
  question: z.string(),
  suggestedAnswer: z.string(),
  confidence: z.number().min(0).max(1),
  isConfirmed: z.boolean()
});

export const ApplicationBlockerSchema = z.object({
  id: z.string(),
  type: z.enum(['subjective_question', 'missing_document', 'captcha', 'salary_expectation', 'other']),
  question: z.string(),
  resolved: z.boolean(),
  userResponse: z.string().nullable()
});

export const ApplicationPreparedDataSchema = z.object({
  selectedResume: ResumeItemSchema.optional(),
  availableResumes: z.array(ResumeItemSchema),
  customizedResumeContent: z.string(),
  customizedResumeConfirmed: z.boolean(),
  customizedHighlights: z.array(z.string()),
  coverLetter: z.string(),
  coverLetterConfirmed: z.boolean(),
  preparedAnswers: z.array(PreparedAnswerSchema)
});

export const ApplicationUpdateSchema = z.object({
  preparedData: z.object({
    coverLetter: z.string().optional(),
    coverLetterConfirmed: z.boolean().optional(),
    customizedHighlights: z.array(z.string()).optional(),
    customizedResumeContent: z.string().optional(),
    customizedResumeConfirmed: z.boolean().optional(),
    preparedAnswers: z.array(PreparedAnswerSchema).optional(),
    selectedResumeId: z.string().nullable().optional()
  }).optional()
});

export const ApplicationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  status: z.enum([
    'draft',
    'prepared',
    'ready_for_review',
    'ready_to_submit',
    'submitted_auto',
    'submitted_manual',
    'rejected'
  ]),
  matchScore: z.number().min(0).max(100),
  readinessScore: z.number().min(0).max(100),
  preparedData: ApplicationPreparedDataSchema,
  blockers: z.array(ApplicationBlockerSchema),
  submittedAt: z.string().nullable()
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationUpdate = z.infer<typeof ApplicationUpdateSchema>;
export type PreparedAnswer = z.infer<typeof PreparedAnswerSchema>;
export type ApplicationBlocker = z.infer<typeof ApplicationBlockerSchema>;
export type ApplicationPreparedData = z.infer<typeof ApplicationPreparedDataSchema>;
