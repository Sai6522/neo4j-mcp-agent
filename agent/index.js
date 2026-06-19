import Groq from 'groq-sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '../.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- MCP Client Setup ---
const mcpTransport = new StdioClientTransport({
  command: 'node',
  args: [path.join(__dirname, '../mcp-server/index.js')],
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
        content: `You are a movie expert assistant powered by a Neo4j graph database. 
You have access to tools to search movies, get recommendations, find actor/director filmographies, and run custom Cypher queries.
Always use the available tools to answer questions. Be concise and helpful.`,
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
