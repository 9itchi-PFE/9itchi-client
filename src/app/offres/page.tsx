import { listPage } from '@/components/public/offerListPage'

// Every open PFE offer, page by page: the page search engines reach the offers through.
const { generateMetadata, Page } = listPage(null)
export { generateMetadata }
export default Page
