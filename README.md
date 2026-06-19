# Neo4j MCP Chat Agent 🎬🤖

A natural language chat interface that queries a **Neo4j graph database** through an **MCP (Model Context Protocol) server**, powered by **Groq LLM**. Ask anything about movies — recommendations, top-rated films, actor filmographies, or custom graph queries — all in plain English.

Built for the **GraphAcademy Cup Week 2** challenge, applying concepts from the *Developing with Neo4j MCP Tools* course.

---

## Architecture

```
User (Browser)
    ↓  HTTP
Chat Agent (Node.js + Express)
    ↓  MCP Protocol (stdio)
MCP Server (Neo4j Tools)
    ↓  neo4j-driver
Neo4j AuraDB (Movies Graph)
```

The LLM (Groq `llama-3.3-70b-versatile`) receives user questions, decides which MCP tool to call, executes it against the live Neo4j graph, and returns a natural language answer.

---

## MCP Tools Exposed

| Tool | Description |
|------|-------------|
| `search_movies` | Search by title, genre, or year |
| `get_recommendations` | Find similar movies via graph traversal |
| `get_person_movies` | Actor/director filmographies |
| `get_top_rated` | Top rated movies, optionally by genre |
| `run_cypher` | Execute read-only Cypher queries |

---

## Graph Schema

```
(:Person {name, role})-[:ACTED_IN]->(:Movie {title, year, genre, rating})
(:Person {name, role})-[:DIRECTED]->(:Movie)
(:Movie)-[:SIMILAR_TO]->(:Movie)
```

---

## Tech Stack

- **Neo4j AuraDB** — cloud-hosted graph database
- **@modelcontextprotocol/sdk** — MCP server/client
- **Groq API** — LLM inference (`llama-3.3-70b-versatile`)
- **Node.js + Express** — agent API server
- **Vanilla HTML/CSS/JS** — chat frontend

---

## Setup

### 1. Prerequisites
- Node.js 18+
- Free [Neo4j AuraDB](https://neo4j.com/cloud/aura) instance
- Free [Groq API key](https://console.groq.com)

### 2. Configure environment

Edit `.env` in the project root:

```env
GROQ_API_KEY=your_groq_api_key

NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=your_username
NEO4J_PASSWORD=your_password
```

### 3. Install dependencies

```bash
cd mcp-server && npm install
cd ../agent && npm install
```

### 4. Seed the database

```bash
cd mcp-server && node seed.js
```

### 5. Start the agent

```bash
cd agent && node index.js
```

Open **http://localhost:3000** in your browser.

---

## Example Queries

- *"What are the top 5 rated movies?"*
- *"Recommend movies similar to Inception"*
- *"What movies did Christopher Nolan direct?"*
- *"Show me all Sci-Fi movies from the 90s"*
- *"Who acted in The Matrix?"*

---

## What I Learned — GraphAcademy

I completed the full GraphAcademy learning path including **Developing with Neo4j MCP Tools**, **Neo4j Fundamentals**, **Cypher Fundamentals**, **Graph Data Modeling Fundamentals**, and **Neo4j & GenerativeAI Fundamentals**.

The most valuable concept was understanding **MCP (Model Context Protocol)** as a standardized bridge between LLMs and external data sources. Instead of hardcoding API calls into a chatbot, MCP lets the LLM *discover* and *invoke* tools dynamically — the agent learns what the Neo4j server can do at runtime by calling `listTools()`.

Applied to this project: the agent has zero hardcoded knowledge of the graph schema. It asks the MCP server what tools exist, then uses the LLM's reasoning to pick the right Cypher query tool for each user question. This is exactly how enterprise AI systems should work — pluggable, discoverable, and decoupled.

The graph data modeling course shaped how I structured the `SIMILAR_TO` relationships — rather than computing similarity at query time, it's pre-modeled as a first-class graph edge, making recommendations an instant traversal rather than an expensive computation.

---

## GraphAcademy Cup Submission

- **Course completed:** Developing with Neo4j MCP Tools (+ full learning path)
- **Project:** Neo4j MCP Chat Agent
- **Tech:** Neo4j AuraDB, MCP SDK, Groq LLM, Node.js
