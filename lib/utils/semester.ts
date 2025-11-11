/**
 * Utility functions for semester determination
 * Based on Vietnamese academic calendar:
 * - HK1 (Fall semester): September - December
 * - HK2 (Spring semester): January - May
 */

export type Semester = "HK1_2024_2025" | "HK2_2024_2025" | "HK1_2025_2026" | "HK2_2025_2026"

/**
 * Determines the current semester based on the current date
 * @returns The current semester string
 */
export function getCurrentSemester(): Semester {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // getMonth() returns 0-11

    // Determine academic year
    // Academic year starts in September (month 9)
    let academicYearStart: number
    if (month >= 9) {
        // September or later: current academic year starts this year
        academicYearStart = year
    } else {
        // January to August: current academic year started last year
        academicYearStart = year - 1
    }

    const academicYearEnd = academicYearStart + 1
    const academicYear = `${academicYearStart}_${academicYearEnd}`

    // Determine semester based on month
    let semester: string
    if (month >= 9 || month <= 5) {
        // September-December: HK1, January-May: HK2
        if (month >= 9) {
            semester = "HK1"
        } else {
            semester = "HK2"
        }
    } else {
        // June-August: Summer break, default to HK2 of previous academic year
        // This is a fallback case
        semester = "HK2"
    }

    return `${semester}_${academicYear}` as Semester
}

/**
 * Gets the next semester
 * @param currentSemester The current semester
 * @returns The next semester
 */
export function getNextSemester(currentSemester: Semester): Semester {
    const semesters: Semester[] = ["HK1_2024_2025", "HK2_2024_2025", "HK1_2025_2026", "HK2_2025_2026"]
    const currentIndex = semesters.indexOf(currentSemester)

    if (currentIndex === -1 || currentIndex === semesters.length - 1) {
        // If not found or last semester, return the first one (wrap around)
        return semesters[0]
    }

    return semesters[currentIndex + 1]
}

/**
 * Formats semester string for display
 * @param semester The semester string
 * @returns Formatted semester string
 */
export function formatSemester(semester: Semester): string {
    return semester.replace(/_/g, " ")
}
