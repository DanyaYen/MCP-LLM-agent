import { Ollama } from "ollama";

const MCP_SERVER_URL = "http://localhost:8001/.well-known/mcp/tool/use";
const ollama = new Ollama({ host: "http://localhost:11434" });

const tools = [
  {
    type: "function",
    function: {
      name: "get_random_fact",
      description: "Fetches a random interesting fact from a service.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

async function callMcpServer() {
  try {
    console.log("[Agent] Calling MCP Server...");
    const response = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_name: "get_random_fact" }),
    });
    if (!response.ok)
      throw new Error(`MCP server returned status ${response.status}`);
    const data = await response.json();
    console.log("[Agent] Received fact from MCP Server:", data.content);
    return data.content;
  } catch (error) {
    console.error("[Agent] Error calling MCP server:", error);
    return "Failed to get fact: Could not connect to the tool server.";
  }
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    const messages = [{ role: "user", content: prompt }];
    const model_to_use = "mistral";

    console.log(`[Agent] Asking LLM (${model_to_use}) what to do...`);
    const initialResponse = await ollama.chat({
      model: model_to_use,
      messages: messages,
      tools: tools,
    });

    const message = initialResponse.message;
    messages.push(message);

    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log("[Agent] LLM decided to use a tool.");
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === "get_random_fact") {
        const fact = await callMcpServer();
        messages.push({
          role: "tool",
          content: fact,
        });

        console.log(
          "[Agent] Sending tool result back to LLM for final response..."
        );
        const finalResponse = await ollama.chat({
          model: model_to_use,
          messages: messages,
        });

        return new Response(
          JSON.stringify({ response: finalResponse.message.content }),
          { status: 200 }
        );
      }
    }

    console.log("[Agent] LLM answered without using a tool.");
    return new Response(JSON.stringify({ response: message.content }), {
      status: 200,
    });
  } catch (error) {
    console.error("[Agent API Error]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
