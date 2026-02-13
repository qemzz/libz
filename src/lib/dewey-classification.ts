// Dewey Decimal Classification System
export interface DeweyClass {
  range: string;
  name: string;
  shelfLocation: string;
}

export const DEWEY_CLASSES: DeweyClass[] = [
  { range: '000–099', name: 'Computer Science, Information & General Works', shelfLocation: 'General Reference Shelf' },
  { range: '100–199', name: 'Philosophy & Psychology', shelfLocation: 'Philosophy Shelf' },
  { range: '200–299', name: 'Religion', shelfLocation: 'Religion Shelf' },
  { range: '300–399', name: 'Social Sciences', shelfLocation: 'Social Sciences Shelf' },
  { range: '400–499', name: 'Language', shelfLocation: 'Language Shelf' },
  { range: '500–599', name: 'Science', shelfLocation: 'Science Shelf' },
  { range: '600–699', name: 'Technology', shelfLocation: 'Technology Shelf' },
  { range: '700–799', name: 'Arts & Recreation', shelfLocation: 'Arts Shelf' },
  { range: '800–899', name: 'Literature', shelfLocation: 'Literature Shelf' },
  { range: '900–999', name: 'History & Geography', shelfLocation: 'History Shelf' },
];

// Map common category names to suggested Dewey ranges
const CATEGORY_TO_DEWEY: Record<string, string> = {
  'computer science': '004',
  'computers': '004',
  'technology': '600',
  'engineering': '620',
  'information': '020',
  'philosophy': '100',
  'psychology': '150',
  'religion': '200',
  'social sciences': '300',
  'politics': '320',
  'economics': '330',
  'law': '340',
  'education': '370',
  'language': '400',
  'english': '420',
  'french': '440',
  'science': '500',
  'mathematics': '510',
  'math': '510',
  'physics': '530',
  'chemistry': '540',
  'biology': '570',
  'medicine': '610',
  'health': '613',
  'agriculture': '630',
  'cooking': '641',
  'arts': '700',
  'music': '780',
  'sports': '796',
  'literature': '800',
  'fiction': '813',
  'poetry': '811',
  'drama': '812',
  'history': '900',
  'geography': '910',
  'biography': '920',
};

export function suggestDeweyNumber(categoryName: string): string | null {
  const lower = categoryName.toLowerCase().trim();
  // Direct match
  if (CATEGORY_TO_DEWEY[lower]) return CATEGORY_TO_DEWEY[lower];
  // Partial match
  for (const [key, value] of Object.entries(CATEGORY_TO_DEWEY)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  return null;
}

export function getDeweyClass(deweyNumber: string): DeweyClass | null {
  const num = parseFloat(deweyNumber);
  if (isNaN(num)) return null;
  const classIndex = Math.floor(num / 100);
  return DEWEY_CLASSES[classIndex] || null;
}

export function getShelfLocation(deweyNumber: string): string {
  const cls = getDeweyClass(deweyNumber);
  return cls?.shelfLocation || 'Unknown Shelf';
}

export function getDeweyClassName(deweyNumber: string): string {
  const cls = getDeweyClass(deweyNumber);
  return cls?.name || 'Unknown';
}
