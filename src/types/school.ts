// School is one entry of the list of schools students choose from (account-api GET /schools). The code is what a
// student's profile keeps; it never changes. The names are shown in the language of the app.
export type School = { code: string; name_fr: string; name_en: string; name_ar: string }

// SchoolNames is what an admin can rename.
export type SchoolNames = Pick<School, 'name_fr' | 'name_en' | 'name_ar'>

// SchoolInput is what is sent to add a school.
export type SchoolInput = SchoolNames & Pick<School, 'code'>
