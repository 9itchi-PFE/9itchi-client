import type { PropsWithChildren } from 'react'
import Link from 'next/link'
import navigationConfig from '@/configs/navigation.config'

const PostLoginLayout = ({ children }: PropsWithChildren) => (
    <div className="flex min-h-screen min-h-dvh">
        <nav className="w-56 shrink-0 border-r p-4">
            <ul className="space-y-2">
                {navigationConfig.map((item) => (
                    <li key={item.key}>
                        <Link href={item.path}>{item.title}</Link>
                    </li>
                ))}
            </ul>
        </nav>
        <main className="flex-1">{children}</main>
    </div>
)

export default PostLoginLayout
