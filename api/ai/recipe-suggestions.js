import OpenAI from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, preferences, dietary } = req.body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_')) {
      return res.status(500).json({ error: 'OpenAI API key not configured or invalid' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Given these ingredients: ${ingredients.join(', ')},
    preferences: ${preferences || 'none'},
    dietary restrictions: ${dietary || 'none'},

    Suggest 3 creative recipes that can be made with these ingredients.
    For each recipe, provide:
    - Recipe name
    - Brief description
    - Estimated cooking time
    - Difficulty level (Easy/Medium/Hard)
    - Key ingredients used

    Format as JSON array with objects containing: name, description, cookingTime, difficulty, ingredients`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const suggestions = JSON.parse(completion.choices[0].message.content || '[]');
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate recipe suggestions' });
  }
}
