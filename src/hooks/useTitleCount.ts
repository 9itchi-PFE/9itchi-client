import { useEffect } from 'react'
import { titleWithCount } from '@/lib/badges'

// useTitleCount keeps « (N) » in front of the tab title while N > 0, also after a page change sets a new title.
export function useTitleCount(count: number) {
    useEffect(() => {
        const apply = () => {
            const next = titleWithCount(document.title, count)
            if (next !== document.title) document.title = next
        }
        apply()
        const title = document.querySelector('title')
        if (!title) return
        const observer = new MutationObserver(apply)
        observer.observe(title, { childList: true, characterData: true, subtree: true })
        return () => {
            observer.disconnect()
            document.title = titleWithCount(document.title, 0)
        }
    }, [count])
}
