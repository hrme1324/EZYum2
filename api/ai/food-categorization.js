import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { foodItems } = req.body;

    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY.includes('your_')) {
      return res.status(500).json({ error: 'Hugging Face API key not configured or invalid' });
    }

    const categories = [];

    for (const item of foodItems) {
      try {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
          {
            inputs: item,
            parameters: {
              candidate_labels: ['fruits', 'vegetables', 'meat', 'dairy', 'grains', 'pantry', 'spices', 'beverages']
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const { label, score } = response.data;
        categories.push({
          item,
          category: label,
          confidence: score
        });
      } catch (error) {
        console.error(`Error categorizing ${item}:`, error);
        categories.push({
          item,
          category: 'pantry',
          confidence: 0.5
        });
      }
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error('Food categorization error:', error);
    res.status(500).json({ error: 'Failed to categorize food items' });
  }
}
