import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, preferences, dietary } = req.body;

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured or invalid' });
    }

    const prompt = `Given these ingredients: ${ingredients.join(', ')},
    preferences: ${preferences}, and dietary restrictions: ${dietary},
    suggest 3 creative recipes. Format as JSON with name, ingredients, instructions, and cook time.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant. Provide recipe suggestions in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const suggestions = completion.choices[0].message.content;
    res.json({ suggestions: JSON.parse(suggestions) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate recipe suggestions' });
  }
}
