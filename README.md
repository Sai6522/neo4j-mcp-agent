# Drug Interaction Checker — Neo4j MCP Agent 💊🤖

A natural language chat interface that queries a **Neo4j graph database of drug interactions** through an **MCP (Model Context Protocol) server**, powered by **Groq LLM**. Ask anything about drug safety — check combinations, find interactions by severity, or explore treatments for conditions — all in plain English.

---

## Architecture

```
User (Browser)
    ↓  HTTP
Chat Agent (Node.js + Express)
    ↓  MCP Protocol (stdio)
MCP Server (Neo4j Tools)
    ↓  neo4j-driver
Neo4j AuraDB (Drug Interactions Graph)
```

---

## MCP Tools Exposed

| Tool | Description |
|------|-------------|
| `search_drugs` | Search by name or category (SSRI, Statin, Antibiotic…) |
| `get_interactions` | All interactions for a given drug with severity + effect |
| `check_combination` | Check pairwise interactions across multiple drugs at once |
| `get_drugs_for_condition` | Find drugs that treat a medical condition |
| `get_major_interactions` | All MAJOR severity interactions in the database |
| `run_cypher` | Execute read-only Cypher queries |

---

## Graph Schema

```
(:Drug {name, category, description})
(:Condition {name})

(:Drug)-[:TREATS]->(:Condition)
(:Drug)-[:INTERACTS_WITH {severity, effect}]->(:Drug)

severity: MAJOR | MODERATE | MINOR
```

---

## Tech Stack

- **Neo4j AuraDB** — cloud-hosted graph database
- **@modelcontextprotocol/sdk** — MCP server/client
- **Groq API** — LLM inference (`qwen/qwen3.6-27b`)
- **Node.js + Express** — agent API server
- **Vanilla HTML/CSS/JS** — chat frontend

---

## Setup

### 1. Configure environment

Edit `.env` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=your_username
NEO4J_PASSWORD=your_password
```

### 2. Seed the database

```bash
cd mcp-server && node seed.js
```

### 3. Start the agent

```bash
npm start
# or: cd agent && node index.js
```

Open **http://localhost:3000**

---

## Example Queries

- *"Is it safe to take Warfarin with Aspirin?"*
- *"Check interactions between Warfarin, Ibuprofen, and Ciprofloxacin"*
- *"What drugs treat Hypertension?"*
- *"Show all MAJOR drug interactions"*
- *"What interacts with Digoxin?"*
- *"List all SSRI medications"*

---

## Disclaimer

> This tool is for **informational and educational purposes only**. Always consult a qualified healthcare professional before making any medication decisions.

---

## Live Demo

🚀 **https://neo4j-mcp-agent.onrender.com**
