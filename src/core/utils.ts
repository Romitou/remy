export function frenchMealPeriod(mealPeriod: string): string {
    switch (mealPeriod) {
        case 'lunch':
            return 'Déjeuner';
        case 'dinner':
            return 'Dîner';
        case 'breakfast':
            return 'Petit-déjeuner';
    }
}

export function normalizeDate(rawDate: string): string {
    const [year, month, day] = rawDate.split('-');
    return `${day}/${month}/${year}`;
}
