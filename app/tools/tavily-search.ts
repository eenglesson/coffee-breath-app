import { z } from 'zod';

// Define the input schema using Zod for type safety and auto-generated JSON schema
const inputSchema = z.object({
  query: z.string().describe('The search query.'),
});

// Define the Tavily search tool
export const tavilySearchTool = {
  name: 'web_search',
  description:
    'Search the web for real-time information using Tavily. Returns summarized answers, results with snippets, and citations.',
  inputSchema, // Zod schema is directly compatible with AI SDK's tools
  execute: async ({ query }: z.infer<typeof inputSchema>) => {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic', // 'basic' for speed; use 'advanced' for deeper crawls if needed
          include_answer: true, // Get Tavily's AI-generated summary
          include_raw_content: false, // Avoid large payloads; set true if full page content needed
          max_results: 5, // Balance: enough results without overwhelming
          include_images: false, // Optional; set true if visuals are useful
          // Add include_domains or exclude_domains arrays here if static filtering needed
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        answer: data.answer || 'No summary available.',
        results: data.results || [], // Array of { title, url, content, score, ... }
        response_time: data.response_time,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  },
};
