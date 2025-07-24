import grokEndPoint from '../grok';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Take the first user message to understand the conversation context
    const firstUserMessage =
      messages.find(
        (msg: { role: string; content: string }) => msg.role === 'user'
      )?.content || '';

    const response = await grokEndPoint.chat.completions.create({
      model: 'grok-3-mini-latest',
      messages: [
        {
          role: 'system',
          content: `Generate a short, clear title (3-6 words) for an educational conversation based on the user's first message. The title should be:
- Descriptive of the educational content or task
- Professional and clear
- Without quotes or special formatting
- Focused on the subject matter or teaching goal

Examples of good titles:
- "Math Quiz Grade 5"
- "Science Plant Questions" 
- "Reading Comprehension Help"
- "History Timeline Project"
- "Creative Writing Ideas"

Return ONLY the title, nothing else.`,
        },
        {
          role: 'user',
          content: `Generate a title for this educational request: "${firstUserMessage}"`,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const title =
      response.choices[0]?.message?.content?.trim() ||
      'Educational Conversation';

    return Response.json({ title });
  } catch (error) {
    console.error('Failed to generate title:', error);
    return Response.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
