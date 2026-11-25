import { describe, expect, it } from 'vitest'
import { MAX_MESSAGE, byDay, draft, isMine, picked } from '@/components/chat/chat'

const student = '7c9e6679-7425-40de-944b-e07fc1f90ae7'
const admin = '00000000-0000-4000-8000-000000000001'
const conversation = { user_id: student }

describe('isMine', () => {
    it('puts the student and the team on their own side, whichever admin wrote', () => {
        expect(isMine({ sender_id: student }, conversation, 'student')).toBe(true)
        expect(isMine({ sender_id: admin }, conversation, 'student')).toBe(false)
        expect(isMine({ sender_id: admin }, conversation, 'team')).toBe(true)
        expect(isMine({ sender_id: 'another-admin' }, conversation, 'team')).toBe(true)
        expect(isMine({ sender_id: student }, conversation, 'team')).toBe(false)
    })
})

describe('draft', () => {
    it('sends what was typed, trimmed, and nothing when it is empty or too long', () => {
        expect(draft('  Bonjour  ')).toBe('Bonjour')
        expect(draft('   \n ')).toBeNull()
        expect(draft('é'.repeat(MAX_MESSAGE))).toHaveLength(MAX_MESSAGE)
        expect(draft('é'.repeat(MAX_MESSAGE + 1))).toBeNull()
    })
})

describe('byDay', () => {
    it('groups the messages of one day, in order', () => {
        const at = (d: number, h: number) => new Date(2026, 10, d, h).toISOString()
        const m = (id: string, created_at: string) => ({ id, conversation_id: 'c', sender_id: student, content: id, created_at })
        const days = byDay([m('a', at(23, 9)), m('b', at(23, 18)), m('c', at(24, 8))])
        expect(days.map((d) => d.messages.map((x) => x.id))).toEqual([['a', 'b'], ['c']])
        expect(byDay([])).toEqual([])
    })
})

describe('picked', () => {
    const list = [{ id: 'aaaaaaaa-0000-4000-8000-000000000002' }]
    it('keeps the conversation of the address bar only when it is in the inbox', () => {
        expect(picked('aaaaaaaa-0000-4000-8000-000000000002', list)).toBe('aaaaaaaa-0000-4000-8000-000000000002')
        expect(picked('aaaaaaaa-0000-4000-8000-000000000009', list)).toBe('')
        expect(picked('../users', list)).toBe('')
        expect(picked(null, list)).toBe('')
    })
})
