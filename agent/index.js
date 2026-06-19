import Groq from 'groq-sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- MCP Client Setup ---
const mcpTransport = new StdioClientTransport({
  command: 'node',
  args: [path.join(__dirname, '../mcp-server/index.js')],
  env: {
    ...process.env,
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    NEO4J_DATABASE: process.env.NEO4J_DATABASE,
  },
});
const mcpClient = new Client({ name: 'neo4j-agent', version: '1.0.0' });
await mcpClient.connect(mcpTransport);

// Fetch available tools from MCP server and convert to Groq tool format
const { tools: mcpTools } = await mcpClient.listTools();
const groqTools = mcpTools.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  },
}));

console.log(`✅ Connected to MCP server. Tools: ${mcpTools.map(t => t.name).join(', ')}`);

// --- Agent Logic ---
async function chat(messages) {
  // Agentic loop: keep calling tools until model stops
  const workingMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3.6-27b',
      messages: workingMessages,
      tools: groqTools,
      tool_choice: 'auto',
    });

    const msg = response.choices[0].message;
    workingMessages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content;
    }

    // Execute all tool calls via MCP
    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      const result = await mcpClient.callTool({ name: tc.function.name, arguments: args });
      const toolContent = result.content[0]?.text || '{}';
      workingMessages.push({ role: 'tool', tool_call_id: tc.id, content: toolContent });
    }
  }

  return 'I was unable to complete the request after multiple attempts.';
}

// --- Express API ---
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const messages = [
      {
        role: 'system',
        content: `You are a clinical drug interaction assistant powered by a Neo4j graph database.
You help healthcare professionals and patients understand drug interactions, check medication safety, and find treatments for conditions.
You have tools to search drugs, check interactions between drugs, find drugs for conditions, and run custom graph queries.
Always use the available tools to answer questions. Clearly flag MAJOR interactions as dangerous.

Important: If a tool returns no results, try searching with a broader or alternative term (e.g. "fever" instead of "high fever", "pain" instead of "chronic pain"). If still no results after one retry, clearly state what is and isn't in the database and suggest related conditions the user could ask about.

Include a disclaimer that this is for informational purposes only and users should consult a healthcare professional.`,
      },
      ...history,
      { role: 'user', content: message },
    ];
    const answer = await chat(messages);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Agent running at http://localhost:${PORT}`));
