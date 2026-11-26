import { listPage } from '@/components/public/offerListPage'

// The open PFE offers of one company (« Stage PFE chez … »); an unknown company is a 404.
const { generateMetadata, Page } = listPage((slug) => ({ company: slug }))
export { generateMetadata }
export default Page
