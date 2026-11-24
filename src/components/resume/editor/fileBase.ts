// fileBase mirrors resume-api's prenom_nom file name so the button can name the file before it exists.
export const fileBase = (name: string, title: string) => {
    const ascii = name
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    return ascii || title
}
