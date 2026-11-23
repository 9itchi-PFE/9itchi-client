import type { PropsWithChildren } from 'react'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'

export default function Layout({ children }: PropsWithChildren) {
    return <PostLoginLayout>{children}</PostLoginLayout>
}
