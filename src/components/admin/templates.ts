import { normalize, type AdminTemplate, type ResumeContent } from '@/types/resume'

// SAMPLE_CV fills the previews of the team's template page: an invented student, no real person.
export const SAMPLE_CV: ResumeContent = normalize({
    contact: {
        name: 'Prénom Nom',
        headline: 'Étudiant·e en génie logiciel, stage PFE de 6 mois',
        email: 'prenom.nom@exemple.tn',
        phone: '+216 00 000 000',
        location: 'Tunis',
        links: ['linkedin.com/in/prenom-nom'],
    },
    summary: 'En dernière année de cycle ingénieur, je cherche un stage PFE en développement web à partir de février.',
    education: [{ school: 'École d’ingénieurs', degree: 'Cycle ingénieur en génie logiciel', location: 'Tunis', start: '2022', end: '2027' }],
    experience: [
        {
            company: 'Entreprise d’accueil',
            title: 'Stage d’été, développement web',
            location: 'Sfax',
            start: 'juil. 2026',
            end: 'août 2026',
            description: ['Développé un tableau de bord avec React et une API Go.', 'Réduit le temps de chargement de 40 %.'],
        },
    ],
    skills: ['Go', 'React', 'PostgreSQL', 'Docker', 'Git'],
    languages: ['Arabe', 'Français', 'Anglais'],
})

const ORDER = ['classic', 'modern', 'compact', 'sidebar', 'split', 'banner']

// ordered lists the templates as the students' gallery does: Classic, Modern, Compact, Sidebar, Split, Banner, then by name.
export const ordered = <T extends Pick<AdminTemplate, 'layout' | 'name'>>(all: T[]): T[] =>
    [...all].sort((a, b) => ORDER.indexOf(a.layout) - ORDER.indexOf(b.layout) || a.name.localeCompare(b.name))

// canWithdraw: students must always have a template to choose, so the last published one stays.
export const canWithdraw = (t: Pick<AdminTemplate, 'id' | 'active'>, all: Pick<AdminTemplate, 'id' | 'active'>[]) =>
    t.active && all.some((o) => o.active && o.id !== t.id)
