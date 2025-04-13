// Simple utility to generate random names for fallback data

const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 
  'Avery', 'Quinn', 'Blake', 'Cameron', 'Reese', 'Finley', 'Dakota', 
  'Skyler', 'Kendall', 'Hayden', 'Parker', 'Emerson', 'Rowan'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

/**
 * Generates a random name for use in fallback data
 * @returns A randomly generated full name
 */
export const generateRandomName = (): string => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};
