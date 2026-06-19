# 🏆 GraphAcademy Cup Submission

> **Topic Title:** Week 2: Neo4j MCP Chat Agent - India

## GraphAcademy Cup Team Profile Link

**Team Profile Link:** https://cup.graphacademy.neo4j.com/teams/country-in

---

## GraphAcademy Public Profile Username

**Public Profile Username:** @venkatasaiprasadp 

---

## Country

**Country:** 🇮🇳 India

---

## GraphAcademy Course Completed

**Course Name:** Developing with Neo4j MCP Tools

---

## Project Name

**Project Name:** Drug Interaction Checker — Natural Language Interface for a Neo4j Clinical Graph

---

## Description

**Description:**

Understanding drug interactions is critical for patient safety, yet the data is locked in complex databases that require specialist knowledge to query. I built a **natural language drug interaction checker** that allows anyone — doctors, pharmacists, or patients — to ask questions in plain English and receive answers sourced directly from a live Neo4j AuraDB graph.

The system uses **MCP (Model Context Protocol)** as the bridge between a Groq LLM and Neo4j. Users type questions like *"Is it safe to combine Warfarin and Aspirin?"* or *"What drugs treat Hypertension?"* — the AI agent autonomously decides which graph tool to invoke, executes the Cypher query, and returns a clear, conversational answer with severity warnings. No Cypher knowledge required.

**Business Impact & Value:**

* **Patient Safety at Scale:** Instantly surfaces MAJOR drug interaction risks (e.g. Warfarin + Ibuprofen → dangerous bleeding risk) before a prescription is filled

* **Pluggable Enterprise Architecture:** The MCP protocol makes every Neo4j tool discoverable at runtime — swap the drug graph for a fraud graph, supply chain graph, or HR org chart with zero agent code changes

* **Democratises Clinical Data Access:** Pharmacists and clinicians can query complex interaction graphs in plain English instead of writing Cypher or navigating legacy drug databases

---

## What Did You Learn?

**What I Learned:**

### a) The Graph Schema (Data Model)

I designed a clinical knowledge graph connecting drugs, conditions, and interaction relationships:

* **Nodes:** `(:Drug {name, category, description})`, `(:Condition {name})`

* **Relationships:**

  * `(:Drug)-[:TREATS]->(:Condition)`

  * `(:Drug)-[:INTERACTS_WITH {severity, effect}]->(:Drug)`

  * severity levels: `MAJOR` | `MODERATE` | `MINOR`

### b) Key Concepts from GraphAcademy

The **Developing with Neo4j MCP Tools** course fundamentally changed how I think about connecting AI to databases:

* **MCP Tool Discovery:** The agent calls `listTools()` at startup and learns what the Neo4j server can do dynamically — zero hardcoded schema knowledge

* **Cypher as a Tool:** Each MCP tool wraps a targeted Cypher pattern. The LLM reasons about which tool to call; Neo4j executes the traversal

* **Graph-Native Thinking (from Graph Data Modeling):** Pre-modeling `INTERACTS_WITH` as a first-class relationship with severity properties means interaction lookups are instant single-hop traversals, not table joins across multiple databases

### c) MCP Tools I Built

**Tool 1: `check_combination` — Multi-Drug Safety Check**

```cypher
UNWIND $drugs AS nameA
UNWIND $drugs AS nameB
WITH nameA, nameB WHERE nameA < nameB
MATCH (a:Drug)-[r:INTERACTS_WITH]->(b:Drug)
WHERE toLower(a.name) CONTAINS toLower(nameA)
  AND toLower(b.name) CONTAINS toLower(nameB)
RETURN a.name AS drug_a, b.name AS drug_b, r.severity, r.effect
ORDER BY CASE r.severity WHEN 'MAJOR' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END
```

*Result:* "Check Warfarin, Aspirin, Ibuprofen together" → returns all pairwise interactions ranked by severity.

---

**Tool 2: `get_interactions` — Full Interaction Profile for One Drug**

```cypher
MATCH (d:Drug)-[r:INTERACTS_WITH]->(other:Drug)
WHERE toLower(d.name) CONTAINS toLower($name)
RETURN d.name AS drug, other.name AS interacts_with,
       r.severity AS severity, r.effect AS effect
ORDER BY CASE r.severity WHEN 'MAJOR' THEN 1 WHEN 'MODERATE' THEN 2 ELSE 3 END
```

*Result:* "What interacts with Warfarin?" → Aspirin (MAJOR), Ibuprofen (MAJOR), Ciprofloxacin (MAJOR) — sorted by danger level.

---

**Tool 3: `run_cypher` — Free-Form Graph Intelligence**

Exposes a read-only Cypher execution tool so the LLM can construct custom graph queries for complex questions not covered by other tools.

```cypher
MATCH (d:Drug)-[r:INTERACTS_WITH]->(other:Drug)
WHERE r.severity = 'MAJOR'
RETURN d.name, collect(other.name) AS dangerous_combinations
```

---

## Screenshot

\[DRAG YOUR COURSE COMPLETION SCREENSHOT HERE\]

---

## Repository / Demo Link

**GitHub:** https://github.com/Sai6522/neo4j-mcp-agent

**Live Demo:** https://neo4j-mcp-agent.onrender.com

---

## Additional Notes

**Additional Notes:**

What struck me most was how MCP fundamentally changes the integration pattern between AI and databases. Traditional chatbots hardcode their data access logic — brittle and tied to a specific schema. With MCP, the agent discovers tools at runtime, making it schema-agnostic and truly pluggable.

The drug interaction domain is where graph databases shine most — a drug's danger isn't just about one interaction, it's about the chain of interactions across a patient's full medication list. That multi-hop reasoning is what graphs do natively and what relational databases struggle with.

I completed the full GraphAcademy recommended learning path: **Neo4j Fundamentals, Cypher Fundamentals, Graph Data Modeling Fundamentals, Importing Data Fundamentals, AuraDB Fundamentals, Neo4j & GenerativeAI Fundamentals, Building Knowledge Graphs with LLMs, Developing with Neo4j MCP Tools**, and the **Neo4j Certified Professional** exam.

The next evolution of this project would be pointing the same MCP agent at an enterprise graph — fraud detection, supply chain risk, or HR skills mapping — with zero changes to the agent layer. That's the real power of MCP + Neo4j.

---

## ✅ Submission Checklist

* I am participating in the GraphAcademy Cup.

* I included my Team Profile Link.

* I included my GraphAcademy Public Profile Username.

* My profile is public and eligible for prize verification.

* My project is related to concepts learned in GraphAcademy.

---

## 📜 Contest Reminder

🎁 One LEGO prize winner will be selected every week during the GraphAcademy Cup.

📜 Terms & Conditions: https://cup.graphacademy.neo4j.com/terms

❓ FAQ: https://cup.graphacademy.neo4j.com/faq
