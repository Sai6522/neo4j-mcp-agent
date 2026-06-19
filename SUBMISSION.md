# 🏆 GraphAcademy Cup Submission

> **Topic Title:** Week 2: Neo4j MCP Chat Agent - India

## GraphAcademy Cup Team Profile Link

**Team Profile Link:** https://cup.graphacademy.neo4j.com/teams/country-in

---

## GraphAcademy Public Profile Username

**Public Profile Username:** [YOUR_GRAPHACADEMY_USERNAME]

---

## Country

**Country:** India

---

## GraphAcademy Course Completed

**Course Name:** Developing with Neo4j MCP Tools

---

## Project Name

**Project Name:** Neo4j MCP Chat Agent — Natural Language Interface for Graph Databases

---

## Description

**Description:**

Querying a graph database has always required knowing Cypher — a barrier that limits Neo4j's power to developers only. I built a **natural language chat agent** that eliminates this barrier entirely, allowing anyone to ask questions in plain English and receive answers sourced directly from a live Neo4j AuraDB graph.

The system uses **MCP (Model Context Protocol)** as the bridge between an LLM and Neo4j. Users type questions like *"Recommend movies similar to Inception"* or *"What did Christopher Nolan direct?"* — the AI agent autonomously decides which graph tool to invoke, executes the Cypher query, and returns a conversational answer. No Cypher knowledge required.

**Business Impact & Value:**
- **Democratises Graph Data Access:** Business analysts and executives can query complex graph data without writing a single line of Cypher
- **Pluggable Enterprise Architecture:** The MCP protocol makes every Neo4j tool discoverable at runtime — swap the movie graph for a fraud graph, supply chain graph, or HR org chart with zero code changes
- **Faster Insights:** Graph traversals answered in seconds through natural language instead of minutes of manual Cypher writing

---

## What Did You Learn?

**What I Learned:**

### a) The Graph Schema (Data Model)

I designed a movie knowledge graph connecting films, people, and relationships:

- **Nodes:** `(:Movie {title, year, genre, rating})`, `(:Person {name, role})`
- **Relationships:**
  - `(:Person)-[:ACTED_IN]->(:Movie)`
  - `(:Person)-[:DIRECTED]->(:Movie)`
  - `(:Movie)-[:SIMILAR_TO]->(:Movie)`

### b) Key Concepts from GraphAcademy

The **Developing with Neo4j MCP Tools** course fundamentally changed how I think about connecting AI to databases:

- **MCP Tool Discovery:** The agent calls `listTools()` at startup and learns what the Neo4j server can do dynamically — zero hardcoded schema knowledge
- **Cypher as a Tool:** Each MCP tool wraps a targeted Cypher pattern. The LLM reasons about which tool to call; Neo4j executes the traversal
- **Graph-Native Thinking (from Graph Data Modeling):** Pre-modeling `SIMILAR_TO` as a first-class relationship means recommendations are an instant single-hop traversal, not a computed similarity score

### c) MCP Tools I Built

**Tool 1: `get_recommendations` — Graph Traversal for Similarity**

```cypher
MATCH (m:Movie {title: $title})-[:SIMILAR_TO]->(rec:Movie)
RETURN rec.title, rec.genre, rec.year, rec.rating
ORDER BY rec.rating DESC
```

*Result:* "Recommend movies like Inception" → returns The Matrix, Interstellar, Memento instantly through graph traversal.

---

**Tool 2: `get_person_movies` — Multi-Relationship Traversal**

```cypher
MATCH (p:Person)-[r:ACTED_IN|DIRECTED]->(m:Movie)
WHERE toLower(p.name) CONTAINS toLower($name)
RETURN p.name, type(r) AS relationship, m.title, m.year, m.rating
ORDER BY m.year DESC
```

*Result:* "Christopher Nolan films" → Inception, Interstellar, The Dark Knight, Batman Begins — with role type included.

---

**Tool 3: `run_cypher` — Free-Form Graph Intelligence**

Exposes a read-only Cypher execution tool so the LLM can construct custom graph queries for complex questions not covered by other tools.

```cypher
MATCH (p:Person)-[:ACTED_IN]->(m:Movie)<-[:DIRECTED]-(d:Person {name: 'Christopher Nolan'})
RETURN p.name, collect(distinct m.title) AS nolan_films
```

---

## Screenshot

[DRAG YOUR COURSE COMPLETION SCREENSHOT HERE]

---

## Repository / Demo Link

**GitHub:** https://github.com/Sai6522/neo4j-mcp-agent

---

## Additional Notes

**Additional Notes:**

What struck me most was how MCP fundamentally changes the integration pattern between AI and databases. Traditional chatbots hardcode their data access logic — brittle and tied to a specific schema. With MCP, the agent discovers tools at runtime, making it schema-agnostic and truly pluggable.

I completed the full GraphAcademy recommended learning path: **Neo4j Fundamentals, Cypher Fundamentals, Graph Data Modeling Fundamentals, Importing Data Fundamentals, AuraDB Fundamentals, Neo4j & GenerativeAI Fundamentals, Building Knowledge Graphs with LLMs, Developing with Neo4j MCP Tools**, and the **Neo4j Certified Professional** exam.

The next evolution of this project would be pointing the same MCP agent at an enterprise graph — fraud detection, supply chain risk, or HR skills mapping — with zero changes to the agent layer. That's the real power of MCP + Neo4j.

---

## ✅ Submission Checklist

- [x] I am participating in the GraphAcademy Cup.
- [x] I included my Team Profile Link.
- [x] I included my GraphAcademy Public Profile Username.
- [x] My profile is public and eligible for prize verification.
- [x] My project is related to concepts learned in GraphAcademy.

---

## 📜 Contest Reminder

🎁 One LEGO prize winner will be selected every week during the GraphAcademy Cup.

📜 Terms & Conditions: https://cup.graphacademy.neo4j.com/terms

❓ FAQ: https://cup.graphacademy.neo4j.com/faq
