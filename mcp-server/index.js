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

const server = new McpServer({ name: 'neo4j-drugs', version: '1.0.0' });

async function query(cypher, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject());
  } finally {
    await session.close();
  }
}

server.registerTool('search_drugs', {
  description: 'Search drugs by name or category (e.g. SSRI, Statin, Antibiotic)',
  inputSchema: {
    name: z.string().optional().describe('Drug name keyword'),
    category: z.string().optional().describe('Drug category e.g. SSRI, Statin, Antibiotic, ACE Inhibitor'),
  }
}, async ({ name, category }) => {
  const where = [];
  const params = {};
  if (name)     { where.push('toLower(d.name) CONTAINS toLower($name)'); params.name = name; }
  if (category) { where.push('toLower(d.category) CONTAINS toLower($category)'); params.category = category; }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await query(
    `MATCH (d:Drug) ${w} RETURN d.name AS name, d.category AS category, d.description AS description ORDER BY d.name`,
    params
  );
  return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
});

server.registerTool('get_interactions', {
  description: 'Get all known drug interactions for a given drug, with severity and effect',
  inputSchema: { name: z.string().describe('Drug name') }
}, async ({ name }) => {
  const rows = await query(
    `MATCH (d:Drug)-[r:INTERACTS_WITH]->(other:Drug)
     WHERE toLower(d.name) CONTAINS toLower($name)
     RETURN d.name AS drug, other.name AS interacts_with, r.severity AS severity, r.effect AS effect
     ORDER BY CASE r.severity WHEN 'MAJOR' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END`,
    { name }
  );
  return { content: [{ type: 'text', text: rows.length ? JSON.stringify(rows, null, 2) : `No interactions found for "${name}"` }] };
});

server.registerTool('check_combination', {
  description: 'Check if two or more drugs interact with each other — returns all pairwise interactions',
  inputSchema: { drugs: z.array(z.string()).describe('List of drug names to check together') }
}, async ({ drugs }) => {
  const rows = await query(
    `UNWIND $drugs AS nameA
     UNWIND $drugs AS nameB
     WITH nameA, nameB WHERE nameA < nameB
     MATCH (a:Drug)-[r:INTERACTS_WITH]->(b:Drug)
     WHERE toLower(a.name) CONTAINS toLower(nameA) AND toLower(b.name) CONTAINS toLower(nameB)
     RETURN a.name AS drug_a, b.name AS drug_b, r.severity AS severity, r.effect AS effect
     ORDER BY CASE r.severity WHEN 'MAJOR' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END`,
    { drugs }
  );
  const text = rows.length
    ? JSON.stringify(rows, null, 2)
    : `No interactions found among: ${drugs.join(', ')}`;
  return { content: [{ type: 'text', text }] };
});

server.registerTool('get_drugs_for_condition', {
  description: 'Get all drugs that treat a given medical condition',
  inputSchema: { condition: z.string().describe('Medical condition e.g. Hypertension, Depression, Type 2 Diabetes') }
}, async ({ condition }) => {
  const rows = await query(
    `MATCH (d:Drug)-[:TREATS]->(c:Condition)
     WHERE toLower(c.name) CONTAINS toLower($condition)
     RETURN d.name AS drug, d.category AS category, d.description AS description, c.name AS condition`,
    { condition }
  );
  return { content: [{ type: 'text', text: rows.length ? JSON.stringify(rows, null, 2) : `No drugs found for "${condition}"` }] };
});

server.registerTool('get_major_interactions', {
  description: 'Get all MAJOR severity drug interactions in the database — the most dangerous combinations',
  inputSchema: {}
}, async () => {
  const rows = await query(
    `MATCH (a:Drug)-[r:INTERACTS_WITH {severity: 'MAJOR'}]->(b:Drug)
     WHERE a.name < b.name
     RETURN a.name AS drug_a, b.name AS drug_b, r.effect AS effect`
  );
  return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
});

server.registerTool('run_cypher', {
  description: 'Run a custom read-only Cypher query on the Neo4j drug interactions graph',
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
console.error('Neo4j Drug Interactions MCP Server running...');

process.on('SIGINT', async () => { await driver.close(); process.exit(0); });
