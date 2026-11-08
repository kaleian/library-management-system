# Library Management System

## Schema Decisions

### Why Book references Genre instead of embedding it

I gave each Book a `genreId` that points to a row in the Genre table, instead of copying the genre's details inside every book.

I did this because the genre is stored in one place only. If I rename a genre like "Sci-Fi" to "Science Fiction", I change one row and every book is updated. If each book had its own copy, I would have to update them all, and some could end up with the old name.

It also keeps the data safe. The foreign key means a book can't point to a genre that doesn't exist. And since PostgreSQL is a relational database, linking tables with foreign keys is the natural way to model this.

### Other decisions

- I used a `Role` enum (PATRON, LIBRARIAN) so a user can only have one of those two roles. New users default to PATRON.
- `isbn`, `email` and genre `name` are unique so there are no duplicates.
- Books have `totalCopies` and `availableCopies` so I can track borrowing later.
- The Review model links a Book and a User, and each user can review a book only once.

## Prisma vs. a document database

What felt different is that I had to plan how the tables relate before adding any data. In a document database I could have nested the genre inside each book, but nothing would keep those copies consistent. With Prisma and PostgreSQL, the database enforces the relationships, so the data stays consistent.