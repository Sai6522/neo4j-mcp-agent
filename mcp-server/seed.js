import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const session = driver.session();

const movies = [
  { title: 'The Matrix', year: 1999, genre: 'Sci-Fi', rating: 8.7 },
  { title: 'The Matrix Reloaded', year: 2003, genre: 'Sci-Fi', rating: 7.2 },
  { title: 'Inception', year: 2010, genre: 'Sci-Fi', rating: 8.8 },
  { title: 'Interstellar', year: 2014, genre: 'Sci-Fi', rating: 8.6 },
  { title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0 },
  { title: 'Batman Begins', year: 2005, genre: 'Action', rating: 8.2 },
  { title: 'Pulp Fiction', year: 1994, genre: 'Crime', rating: 8.9 },
  { title: 'Fight Club', year: 1999, genre: 'Drama', rating: 8.8 },
  { title: 'Forrest Gump', year: 1994, genre: 'Drama', rating: 8.8 },
  { title: 'The Shawshank Redemption', year: 1994, genre: 'Drama', rating: 9.3 },
  { title: 'Goodfellas', year: 1990, genre: 'Crime', rating: 8.7 },
  { title: 'The Godfather', year: 1972, genre: 'Crime', rating: 9.2 },
  { title: 'Avengers: Endgame', year: 2019, genre: 'Action', rating: 8.4 },
  { title: 'Avatar', year: 2009, genre: 'Sci-Fi', rating: 7.8 },
  { title: 'The Lion King', year: 1994, genre: 'Animation', rating: 8.5 },
];

const actors = [
  { name: 'Keanu Reeves', movies: ['The Matrix', 'The Matrix Reloaded'] },
  { name: 'Laurence Fishburne', movies: ['The Matrix', 'The Matrix Reloaded'] },
  { name: 'Leonardo DiCaprio', movies: ['Inception', 'The Departed'] },
  { name: 'Christian Bale', movies: ['The Dark Knight', 'Batman Begins'] },
  { name: 'Morgan Freeman', movies: ['The Dark Knight', 'The Shawshank Redemption'] },
  { name: 'Tom Hanks', movies: ['Forrest Gump'] },
  { name: 'Brad Pitt', movies: ['Fight Club'] },
  { name: 'Samuel L. Jackson', movies: ['Pulp Fiction', 'Avengers: Endgame'] },
];

const directors = [
  { name: 'Christopher Nolan', movies: ['Inception', 'Interstellar', 'The Dark Knight', 'Batman Begins'] },
  { name: 'The Wachowskis', movies: ['The Matrix', 'The Matrix Reloaded'] },
  { name: 'Quentin Tarantino', movies: ['Pulp Fiction'] },
  { name: 'David Fincher', movies: ['Fight Club'] },
  { name: 'Robert Zemeckis', movies: ['Forrest Gump'] },
  { name: 'Frank Darabont', movies: ['The Shawshank Redemption'] },
];

const similarities = [
  ['The Matrix', 'Inception'],
  ['The Matrix', 'Interstellar'],
  ['Inception', 'Interstellar'],
  ['The Dark Knight', 'Batman Begins'],
  ['Pulp Fiction', 'Goodfellas'],
  ['Goodfellas', 'The Godfather'],
  ['Fight Club', 'Pulp Fiction'],
  ['The Shawshank Redemption', 'Forrest Gump'],
];

try {
  // Clear existing data
  await session.run('MATCH (n) DETACH DELETE n');

  // Create movies
  for (const m of movies) {
    await session.run(
      'CREATE (:Movie {title: $title, year: $year, genre: $genre, rating: $rating})',
      m
    );
  }

  // Create actors and relationships
  for (const a of actors) {
    await session.run('MERGE (:Person {name: $name, role: "Actor"})', { name: a.name });
    for (const title of a.movies) {
      await session.run(
        `MATCH (p:Person {name: $name}), (m:Movie {title: $title})
         MERGE (p)-[:ACTED_IN]->(m)`,
        { name: a.name, title }
      );
    }
  }

  // Create directors and relationships
  for (const d of directors) {
    await session.run('MERGE (:Person {name: $name, role: "Director"})', { name: d.name });
    for (const title of d.movies) {
      await session.run(
        `MATCH (p:Person {name: $name}), (m:Movie {title: $title})
         MERGE (p)-[:DIRECTED]->(m)`,
        { name: d.name, title }
      );
    }
  }

  // Create similarity relationships
  for (const [a, b] of similarities) {
    await session.run(
      `MATCH (a:Movie {title: $a}), (b:Movie {title: $b})
       MERGE (a)-[:SIMILAR_TO]->(b)
       MERGE (b)-[:SIMILAR_TO]->(a)`,
      { a, b }
    );
  }

  console.log('✅ Database seeded successfully!');
} catch (err) {
  console.error('❌ Seed error:', err.message);
} finally {
  await session.close();
  await driver.close();
}
