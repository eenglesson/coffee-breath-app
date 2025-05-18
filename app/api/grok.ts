import OpenAI from 'openai';

const grokEndPoint = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export default grokEndPoint;
