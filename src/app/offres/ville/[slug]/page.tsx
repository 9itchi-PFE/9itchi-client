import { listPage } from '@/components/public/offerListPage'

// The open PFE offers of one city (« Stage PFE à Sfax »); an unknown city is a 404.
const { generateMetadata, Page } = listPage((slug) => ({ city: slug }))
export { generateMetadata }
export default Page
