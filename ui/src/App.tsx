import { useState } from 'react'
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Command,
  Compass,
  FileUser,
  Filter,
  MapPin,
  Plus,
  Search,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { JobList } from './features/jobs/JobList'
import { SearchForm } from './features/searches/SearchForm'

const navItems = [
  { label: 'Découvrir', icon: Compass, to: '/' },
  {
    label: 'Mes candidatures',
    icon: BriefcaseBusiness,
    to: '/applications',
    count: '4',
  },
  { label: 'Offres sauvegardées', icon: Bookmark, to: '/saved' },
  { label: 'Mon profil', icon: UserRound, to: '/profile' },
]

const todayLabel = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export default function App() {
  const [activeFilter, setActiveFilter] = useState('Toutes')
  const [query, setQuery] = useState('')
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)

  function toggleSaved(jobId: string) {
    setSavedJobs((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId],
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Jober, accueil">
          <span className="brand-mark">
            <Compass size={19} strokeWidth={2.4} />
          </span>
          <span>
            jober<span className="brand-period">.</span>
          </span>
        </a>

        <div className="sidebar-section-label">ESPACE PERSONNEL</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {navItems.map(({ label, icon: Icon, to, count }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section-row">
          <div className="sidebar-section-label">MES RECHERCHES</div>
          <button
            className="icon-button tiny"
            aria-label="Ajouter une recherche"
            onClick={() => setShowSearch(true)}
          >
            <Plus size={15} />
          </button>
        </div>
        <button
          className="saved-search"
          onClick={() => setQuery('Product designer')}
        >
          <span className="search-dot green" />
          <span>Product design</span>
          <span className="search-number">12</span>
        </button>
        <button className="saved-search" onClick={() => setQuery('Growth')}>
          <span className="search-dot blue" />
          <span>Product growth</span>
          <span className="search-number">8</span>
        </button>
        <button
          className="saved-search"
          onClick={() => setQuery('Lead Product Designer')}
        >
          <span className="search-dot orange" />
          <span>Design leadership</span>
          <span className="search-number">5</span>
        </button>
        <button className="new-search" onClick={() => setShowSearch(true)}>
          <Plus size={15} /> Nouvelle recherche
        </button>

        <div className="sidebar-bottom">
          <div className="profile-nudge">
            <div className="nudge-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <strong>Complète ton profil</strong>
              <p>Un profil complet améliore tes matchs.</p>
            </div>
            <div className="profile-progress">
              <span />
            </div>
            <button className="text-button">
              Compléter <span>→</span>
            </button>
          </div>
          <button className="nav-item muted">
            <Settings2 size={18} strokeWidth={1.8} />
            <span>Paramètres</span>
          </button>
          <button className="nav-item muted">
            <CircleHelp size={18} strokeWidth={1.8} />
            <span>Centre d'aide</span>
          </button>
          <button className="account-row">
            <span className="avatar">SL</span>
            <span className="account-copy">
              <strong>Samira L.</strong>
              <small>Compte personnel</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Mon espace</span>
            <span className="crumb-divider">/</span>
            <strong>Découvrir</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="command-search"
              onClick={() => document.getElementById('job-search')?.focus()}
            >
              <Search size={15} />
              <span>Recherche rapide...</span>
              <kbd>
                <Command size={11} /> K
              </kbd>
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>
            <span className="avatar top-avatar">SL</span>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> {todayLabel}
              </div>
              <h1>
                Bonjour Samira <span className="wave">✳</span>
              </h1>
              <p className="welcome-subtitle">
                On a trouvé de nouvelles opportunités qui pourraient te plaire.
              </p>
            </div>
            <button
              className="button button-primary"
              onClick={() => setShowSearch(true)}
            >
              <Plus size={17} /> Créer une recherche
            </button>
          </section>

          <section
            className="insight-strip"
            aria-label="Résumé de la recherche"
          >
            <div className="insight-icon">
              <Sparkles size={17} />
            </div>
            <p>
              <strong>12 nouvelles offres</strong> correspondent à tes critères
              depuis ta dernière visite.
            </p>
            <span className="insight-divider" />
            <span className="insight-match">
              Match moyen <strong>82%</strong>
            </span>
            <button
              className="insight-link"
              onClick={() => setActiveFilter('Nouvelles')}
            >
              Voir les nouveautés <span>→</span>
            </button>
          </section>

          <SearchForm
            query={query}
            onQueryChange={setQuery}
            onSearch={() => undefined}
          />

          <section className="results-section">
            <div className="results-heading">
              <div>
                <h2>
                  Offres pour toi <span className="result-count">24</span>
                </h2>
                <p>Classées selon leur compatibilité avec ton profil</p>
              </div>
              <button className="button button-outline filter-button">
                <Filter size={15} /> Filtres{' '}
                <span className="filter-count">2</span>
              </button>
            </div>
            <div
              className="filter-tabs"
              role="tablist"
              aria-label="Filtrer les offres"
            >
              {['Toutes', 'Très pertinentes', 'Nouvelles', 'Sauvegardées'].map(
                (filter) => (
                  <button
                    key={filter}
                    className={`filter-tab${activeFilter === filter ? ' selected' : ''}`}
                    role="tab"
                    aria-selected={activeFilter === filter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                    {filter === 'Nouvelles' && <span className="tab-new-dot" />}
                  </button>
                ),
              )}
              <button className="sort-control">
                Trier par <strong>Meilleur match</strong>
                <ChevronDown size={14} />
              </button>
            </div>
            <JobList
              activeFilter={activeFilter}
              query={query}
              savedJobs={savedJobs}
              onToggleSaved={toggleSaved}
            />
            <button className="load-more">
              Charger plus d'offres <ChevronDown size={15} />
            </button>
          </section>
          <footer className="page-footer">
            <span>
              <FileUser size={14} /> Aperçu avec données de démonstration
            </span>
            <span>Aucune source d’offres connectée</span>
            <button>
              Actualiser les offres <span>↻</span>
            </button>
          </footer>
        </div>
      </main>
      {showSearch && (
        <SearchDialog
          onClose={() => setShowSearch(false)}
          onCreate={(name) => {
            setQuery(name)
            setShowSearch(false)
          }}
        />
      )}
    </div>
  )
}

function SearchDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
        <div className="dialog-icon">
          <Search size={19} />
        </div>
        <h2 id="dialog-title">Créer une recherche</h2>
        <p>
          Décris le poste que tu vises. Tu pourras affiner les critères ensuite.
        </p>
        <label htmlFor="search-name">Intitulé ou mots-clés</label>
        <input
          id="search-name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && name.trim()) onCreate(name.trim())
          }}
          placeholder="Ex. Product designer, remote..."
        />
        <div className="dialog-hint">
          <MapPin size={14} /> Basé sur tes préférences de localisation et de
          contrat
        </div>
        <button
          className="button button-primary dialog-submit"
          disabled={!name.trim()}
          onClick={() => onCreate(name.trim())}
        >
          Lancer la recherche <span>→</span>
        </button>
      </section>
    </div>
  )
}
