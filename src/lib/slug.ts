// Shared by the server pages and the client: how job-api names cities and companies in public addresses.

// slug is how job-api names a city or company in an address: accents folded, lower case, words joined by dashes
// (services.Slug in job-api; « Société Générale » -> societe-generale).
export function slug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

const NOT_CITIES = new Set(['tunisie', 'tunisia', 'tn', 'remote', 'teletravail', 'a-distance', 'hybride', 'hybrid', 'full-remote'])

// cityOf is the city of an offer's location, as job-api groups offers by city: the part before the first comma,
// or '' when it names the country or remote work.
export function cityOf(location: string): string {
    const first = (location.split(',')[0] ?? '').trim().split(/\s+/).join(' ')
    return NOT_CITIES.has(slug(first)) ? '' : first
}
