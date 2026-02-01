import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const roles = ['admin', 'moderator', 'user'];
const genders = ['male', 'female'];

const users = Array.from({ length: 100 }, (_, i) => {
  const gender = faker.helpers.arrayElement(genders);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const birthDate = faker.date.birthdate({ min: 18, max: 70, mode: 'age' });
  return {
    id: i + 1,
    firstName,
    lastName,
    maidenName: faker.helpers.maybe(() => faker.person.lastName(), { probability: 0.3 }) || '',
    age: faker.number.int({ min: 18, max: 70 }),
    gender,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number(),
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password(),
    birthDate: `${birthDate.getFullYear()}-${birthDate.getMonth() + 1}-${birthDate.getDate()}`,
    image: `https://dummyjson.com/icon/user${i + 1}/128`,
    bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
    height: faker.number.float({ min: 150, max: 200, fractionDigits: 2 }),
    weight: faker.number.float({ min: 45, max: 120, fractionDigits: 2 }),
    eyeColor: faker.helpers.arrayElement(['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber']),
    hair: {
      color: faker.helpers.arrayElement(['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White']),
      type: faker.helpers.arrayElement(['Straight', 'Curly', 'Wavy', 'Kinky']),
    },
    address: {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      stateCode: faker.location.state({ abbreviated: true }),
      postalCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    company: {
      name: faker.company.name(),
      department: faker.commerce.department(),
      title: faker.person.jobTitle(),
    },
    role: faker.helpers.arrayElement(roles),
  };
});

const db = { users };
const outPath = join(__dirname, 'db.json');
writeFileSync(outPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Wrote ${users.length} users to ${outPath}`);
