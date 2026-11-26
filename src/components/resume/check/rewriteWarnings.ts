// Codes resume-api puts in `warnings` next to a rewrite proposal, and the message key each one shows. A code unknown
// to this client (a newer deploy) is dropped; `warnings` may be absent on older deploys.
const WARNING_KEYS: Record<string, string> = { new_numbers: 'warnNewNumbers', too_long: 'warnTooLong' }

export const warningKeys = (warnings: string[] | null | undefined): string[] => [...new Set((warnings ?? []).map((w) => WARNING_KEYS[w]).filter(Boolean))]
