import {
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react'
import type { CSSProperties } from 'react'

type Job = {
  id: string
  company: string
  mark: string
  markClass: string
  role: string
  location: string
  contract: string
  salary: string
  posted: string
  match: number
  skills: string[]
  missing?: string
  status?: string
  fresh?: boolean
}

const jobs: Job[] = [
  {
    id: 'linear',
    company: 'Linear',
    mark: 'L',
    markClass: 'linear',
    role: 'Senior Product Designer',
    location: 'Paris · Hybride',
    contract: 'CDI',
    salary: '60–75k €',
    posted: 'Il y a 2 h',
    match: 96,
    skills: ['Product design', 'Figma', 'Design systems'],
    fresh: true,
  },
  {
    id: 'mistral',
    company: 'Mistral AI',
    mark: 'M',
    markClass: 'mistral',
    role: 'Product Designer',
    location: 'Paris · Présentiel',
    contract: 'CDI',
    salary: '55–70k €',
    posted: 'Il y a 5 h',
    match: 89,
    skills: ['Figma', 'Prototypage', 'SaaS'],
    missing: 'Expérience IA souhaitée',
    fresh: true,
  },
  {
    id: 'doctolib',
    company: 'Doctolib',
    mark: 'D',
    markClass: 'doctolib',
    role: 'Product Designer — Growth',
    location: 'Paris · Hybride',
    contract: 'CDI',
    salary: '55–68k €',
    posted: 'Hier',
    match: 84,
    skills: ['Product design', 'A/B testing', 'Figma'],
    missing: 'Expérience B2C souhaitée',
  },
  {
    id: 'backmarket',
    company: 'Back Market',
    mark: 'B',
    markClass: 'backmarket',
    role: 'Lead Product Designer',
    location: 'Paris · Hybride',
    contract: 'CDI',
    salary: '70–85k €',
    posted: 'Hier',
    match: 78,
    skills: ['Design systems', 'Leadership', 'Figma'],
    missing: 'Management d’équipe requis',
  },
]

type JobListProps = {
  activeFilter: string
  query: string
  savedJobs: string[]
  onToggleSaved: (id: string) => void
}

export function JobList({
  activeFilter,
  query,
  savedJobs,
  onToggleSaved,
}: JobListProps) {
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery = `${job.role} ${job.company} ${job.skills.join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase())
    if (!matchesQuery) return false
    if (activeFilter === 'Très pertinentes') return job.match >= 85
    if (activeFilter === 'Nouvelles') return job.fresh
    if (activeFilter === 'Sauvegardées') return savedJobs.includes(job.id)
    return true
  })

  if (filteredJobs.length === 0)
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <BriefcaseBusiness size={21} />
        </div>
        <strong>Aucune offre pour le moment</strong>
        <p>Essaie d’autres mots-clés ou vérifie tes filtres.</p>
      </div>
    )

  return (
    <div className="job-list">
      {filteredJobs.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          saved={savedJobs.includes(job.id)}
          onToggleSaved={() => onToggleSaved(job.id)}
        />
      ))}
    </div>
  )
}

function JobRow({
  job,
  saved,
  onToggleSaved,
}: {
  job: Job
  saved: boolean
  onToggleSaved: () => void
}) {
  return (
    <article className="job-row">
      <div className={`company-mark ${job.markClass}`} aria-label={job.company}>
        {job.mark}
      </div>
      <div className="job-main">
        <div className="job-company-line">
          <span>{job.company}</span>
          {job.fresh && (
            <span className="new-badge">
              <i /> Nouveau
            </span>
          )}
          <span className="posted">
            <Clock3 size={12} />
            {job.posted}
          </span>
        </div>
        <h3>{job.role}</h3>
        <div className="job-meta">
          <span>
            <MapPin size={13} />
            {job.location}
          </span>
          <i />
          <span>{job.contract}</span>
          <i />
          <span>{job.salary}</span>
        </div>
        <div className="job-skills">
          {job.skills.map((skill) => (
            <span className="skill-chip" key={skill}>
              {skill}
            </span>
          ))}
          {job.missing && (
            <span className="missing-skill">+ {job.missing}</span>
          )}
        </div>
      </div>
      <div className="job-side">
        <div className="match-score">
          <span
            className="match-ring"
            style={{ '--score': `${job.match}%` } as CSSProperties}
          >
            <span>{job.match}</span>
          </span>
          <span className="match-label">Match</span>
        </div>
        <div className="job-actions">
          <button
            className={`icon-button save-button${saved ? ' is-saved' : ''}`}
            aria-label={
              saved ? 'Retirer des sauvegardées' : 'Sauvegarder l’offre'
            }
            aria-pressed={saved}
            onClick={onToggleSaved}
          >
            <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button className="button button-primary details-button">
            Voir l’offre <ExternalLink size={13} />
          </button>
        </div>
      </div>
      {job.match >= 90 && (
        <span className="great-match">
          <Sparkles size={12} /> Excellent match
        </span>
      )}
    </article>
  )
}
