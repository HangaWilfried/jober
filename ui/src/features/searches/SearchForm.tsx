import { MapPin, Search, SlidersHorizontal, X } from 'lucide-react'

type SearchFormProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearch: () => void
}

export function SearchForm({
  query,
  onQueryChange,
  onSearch,
}: SearchFormProps) {
  return (
    <form
      className="search-panel"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <label className="search-field job-field" htmlFor="job-search">
        <Search size={19} />
        <input
          id="job-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Intitulé de poste, compétence ou entreprise"
        />
        {query && (
          <button
            type="button"
            className="clear-search"
            aria-label="Effacer la recherche"
            onClick={() => onQueryChange('')}
          >
            <X size={15} />
          </button>
        )}
      </label>
      <span className="search-separator" />
      <label className="search-field location-field" htmlFor="job-location">
        <MapPin size={18} />
        <input
          id="job-location"
          defaultValue="Paris, France"
          aria-label="Localisation"
        />
      </label>
      <button type="button" className="button button-outline search-filter">
        <SlidersHorizontal size={16} />
        <span>Filtres</span>
      </button>
      <button type="submit" className="button button-primary search-submit">
        Rechercher
      </button>
    </form>
  )
}
