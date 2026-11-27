// What the CV check (resume-api rule quantified_results) counts as a figure in a line.
const FIGURE = /[0-9]|\[NOMBRE\]|\[NUMBER\]/

// usableSuggestion is the first AI proposal worth applying: not the line as it already is, and, when the check asks
// for a figure, one that shows a figure or a [NOMBRE] mark. Applying anything else would leave the same finding.
export function usableSuggestion(suggestions: string[], was: string, needsFigure: boolean): string {
    const same = was.trim()
    return suggestions.find((s) => s.trim() !== '' && s.trim() !== same && (!needsFigure || FIGURE.test(s))) ?? ''
}
