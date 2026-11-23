import { ADMIN, CANDIDATE } from '@/constants/roles.constant'

export type NavItem = { key: string; path: string; title: string; roles: string[] }

const navigationConfig: NavItem[] = [
    { key: 'dashboard', path: '/dashboard', title: 'Dashboard', roles: [CANDIDATE] },
    { key: 'resumes', path: '/resumes', title: 'Resumes', roles: [CANDIDATE] },
    { key: 'jobs', path: '/jobs', title: 'Opportunities', roles: [CANDIDATE] },
    { key: 'applications', path: '/applications', title: 'Applications', roles: [CANDIDATE] },
    { key: 'support', path: '/support', title: 'Support', roles: [CANDIDATE] },
    { key: 'settings', path: '/settings', title: 'Settings', roles: [CANDIDATE] },
    { key: 'admin', path: '/admin', title: 'Statistics', roles: [ADMIN] },
    { key: 'admin-users', path: '/admin/users', title: 'Users', roles: [ADMIN] },
    { key: 'admin-plans', path: '/admin/plans', title: 'Plans', roles: [ADMIN] },
    { key: 'admin-promo', path: '/admin/promo-codes', title: 'Promo codes', roles: [ADMIN] },
    { key: 'admin-support', path: '/admin/support', title: 'Live chat', roles: [ADMIN] },
]

export default navigationConfig
