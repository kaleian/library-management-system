// api/prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
];

const books: {
  title: string;
  author: string;
  isbn: string;
  copies: number;
  genre: string; // genre slug
}[] = [
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', copies: 3, genre: 'science-fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', copies: 2, genre: 'science-fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', copies: 2, genre: 'science-fiction' },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', copies: 4, genre: 'science-fiction' },
  // Fantasy
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', copies: 5, genre: 'fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', copies: 2, genre: 'fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', copies: 3, genre: 'fantasy' },
  { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', isbn: '9780765311788', copies: 3, genre: 'fantasy' },
  // Mystery
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '9780141034379', copies: 2, genre: 'mystery' },
  { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '9780062073488', copies: 3, genre: 'mystery' },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', isbn: '9780307454546', copies: 2, genre: 'mystery' },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', copies: 2, genre: 'mystery' },
  // Non-Fiction
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', copies: 4, genre: 'non-fiction' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', copies: 5, genre: 'non-fiction' },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', copies: 2, genre: 'non-fiction' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', isbn: '9780135957059', copies: 3, genre: 'non-fiction' },
];

async function main() {
  // Genres first: books need their ids. upsert makes the seed safe to re-run.
  const genreIdBySlug = new Map<string, number>();
  for (const g of genres) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: g,
    });
    genreIdBySlug.set(g.slug, genre.id);
  }

  for (const b of books) {
    const genreId = genreIdBySlug.get(b.genre);
    if (genreId === undefined) throw new Error(`Unknown genre slug: ${b.genre}`);

    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        totalCopies: b.copies,
        availableCopies: b.copies,
        genreId,
      },
    });
  }

  // Sample users (one per role) so Review and later features have data
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.test' },
    update: {},
    create: { email: 'librarian@library.test', name: 'Lina Librarian', role: Role.LIBRARIAN },
  });
  const patron = await prisma.user.upsert({
    where: { email: 'patron@library.test' },
    update: {},
    create: { email: 'patron@library.test', name: 'Pat Patron', role: Role.PATRON },
  });

  // Stretch: one sample review
  const dune = await prisma.book.findUnique({ where: { isbn: '9780441013593' } });
  if (dune) {
    await prisma.review.upsert({
      where: { bookId_userId: { bookId: dune.id, userId: patron.id } },
      update: {},
      create: { bookId: dune.id, userId: patron.id, rating: 5, comment: 'A classic.' },
    });
  }

  console.log(
    `Seeded ${genres.length} genres, ${books.length} books, 2 users (${librarian.role}, ${patron.role}).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

