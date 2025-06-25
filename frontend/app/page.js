"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setPrompt("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error("Something went wrong on the server.");
      }

      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to fetch from agent API:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I couldn't get a response. Please check the console.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen flex-col items-center justify-between bg-gray-900 text-white">
      <div className="w-full max-w-3xl mx-auto p-4 flex flex-col h-full">
        <h1 className="text-4xl font-bold mb-4 text-cyan-400 text-center">
          MCP Agent Interface
        </h1>
        <div className="flex-grow bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Ask me for a random fact!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.role === "user" ? "bg-cyan-700 ml-auto" : "bg-gray-700"
                  }`}
                >
                  <p className="text-sm font-bold capitalize mb-1">
                    {msg.role}
                  </p>
                  <p className="text-white whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Tell me a random fact"
            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-r-lg font-semibold transition-colors"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
