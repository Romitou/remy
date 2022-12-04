export function frenchMealPeriod(mealPeriod: string): string {
    switch (mealPeriod.toLocaleLowerCase()) {
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

export function convertTime12to24(time12h: string): string {
    const [time, modifier] = time12h.split(' ');

    let [hours, minutes] = time.split(':');

    if (hours === '12') {
        hours = '00';
    }

    if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
    }

    return `${hours}:${minutes}`;
}
