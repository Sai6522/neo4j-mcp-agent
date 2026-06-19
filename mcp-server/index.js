import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const server = new McpServer({ name: 'neo4j-movies', version: '1.0.0' });

async function query(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject());
  } finally {
    await session.close();
  }
}

server.registerTool('search_movies', {
  description: 'Search movies by title keyword, genre, or year',
  inputSchema: {
    keyword: z.string().optional().describe('Title keyword'),
    genre: z.string().optional().describe('Genre e.g. Sci-Fi, Drama, Crime, Action'),
    year: z.number().int().optional().describe('Release year'),
  }
}, async ({ keyword, genre, year }) => {
  const where = [];
  const params = {};
  if (keyword) { where.push('toLower(m.title) CONTAINS toLower($keyword)'); params.keyword = keyword; }
  if (genre)   { where.push('toLower(m.genre) = toLower($genre)'); params.genre = genre; }
  if (year)    { where.push('m.year = $year'); params.year = neo4j.int(year); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await query(`MATCH (m:Movie) ${w} RETURN m.title AS title, m.genre AS genre, m.year AS year, m.rating AS rating ORDER BY m.rating DESC LIMIT 10`, params);
  return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
});

server.registerTool('get_recommendations', {
  description: 'Get movies similar/recommended based on a given movie title',
  inputSchema: { title: z.string().describe('Movie title') }
}, async ({ title }) => {
  const rows = await query(
    `MATCH (m:Movie {title: $title})-[:SIMILAR_TO]->(r:Movie)
     RETURN r.title AS title, r.genre AS genre, r.year AS year, r.rating AS rating ORDER BY r.rating DESC`,
    { title }
  );
  return { content: [{ type: 'text', text: rows.length ? JSON.stringify(rows, null, 2) : `No recommendations found for "${title}"` }] };
});

server.registerTool('get_person_movies', {
  description: 'Get movies for an actor or director by name',
  inputSchema: { name: z.string().describe('Actor or director name') }
}, async ({ name }) => {
  const rows = await query(
    `MATCH (p:Person)-[r:ACTED_IN|DIRECTED]->(m:Movie)
     WHERE toLower(p.name) CONTAINS toLower($name)
     RETURN p.name AS person, p.role AS role, type(r) AS relationship, m.title AS movie, m.year AS year, m.rating AS rating
     ORDER BY m.year DESC`,
    { name }
  );
  return { content: [{ type: 'text', text: rows.length ? JSON.stringify(rows, null, 2) : `No person found matching "${name}"` }] };
});

server.registerTool('get_top_rated', {
  description: 'Get top 5 rated movies, optionally filtered by genre',
  inputSchema: {
    genre: z.string().optional().describe('Optional genre filter e.g. Action, Drama, Sci-Fi, Crime'),
  }
}, async ({ genre }) => {
  const w = genre ? 'WHERE toLower(m.genre) = toLower($genre)' : '';
  const rows = await query(
    `MATCH (m:Movie) ${w} RETURN m.title AS title, m.genre AS genre, m.year AS year, m.rating AS rating ORDER BY m.rating DESC LIMIT 5`,
    { genre: genre || '' }
  );
  return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
});

server.registerTool('run_cypher', {
  description: 'Run a custom read-only Cypher query on the Neo4j movies graph',
  inputSchema: { cypher: z.string().describe('Read-only Cypher query') }
}, async ({ cypher }) => {
  if (/\b(CREATE|DELETE|SET|MERGE|DROP|REMOVE)\b/i.test(cypher)) {
    return { content: [{ type: 'text', text: 'Error: Only read-only queries allowed.' }] };
  }
  const rows = await query(cypher);
  return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Neo4j MCP Server running...');

process.on('SIGINT', async () => { await driver.close(); process.exit(0); });
