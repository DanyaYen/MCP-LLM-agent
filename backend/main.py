import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

class Tool(BaseModel):
    name: str = Field(..., description="The name of the tool to be used by the model.")
    description: str = Field(..., description="A detailed description of what the tool does.")

class ToolUseRequest(BaseModel):
    tool_name: str

class ToolUseResponse(BaseModel):
    content: str

TOOL_NAME = "get_random_fact"
TOOL_DESCRIPTION = (
    "Returns a random interesting fact in English from a public API. "
    "This tool does not accept any parameters."
)

def get_random_fact_from_api() -> str:
    api_url = "https://uselessfacts.jsph.pl/api/v2/facts/random"
    try:
        with httpx.Client() as client:
            response = client.get(api_url, follow_redirects=True)
            response.raise_for_status() 
            data = response.json()
            return data.get("text", "Could not extract fact from API response.")
    except httpx.RequestError as e:
        print(f"Error requesting the fact API: {e}")
        return "Could not connect to the random fact service."

app = FastAPI(
    title="MCP Fact Server",
    description="A simple MCP-compliant server that provides random facts.",
    version="1.0.0",
)

@app.get("/.well-known/mcp/tools", response_model=List[Tool], tags=["MCP Discovery"])
async def list_tools():
    return [
        Tool(name=TOOL_NAME, description=TOOL_DESCRIPTION)
    ]

@app.post("/.well-known/mcp/tool/use", response_model=ToolUseResponse, tags=["MCP Tool Use"])
async def use_tool(request: ToolUseRequest):
    if request.tool_name == TOOL_NAME:
        fact = get_random_fact_from_api()
        return ToolUseResponse(content=fact)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Tool with name '{request.tool_name}' not found."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
