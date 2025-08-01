export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.MEALDB_API_KEY || '1'; // MealDB has a public API
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/${apiKey}/search.php?s=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const meals = data.meals || [];
    const formattedMeals = meals.map((meal) => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      image: meal.strMealThumb,
      tags: meal.strTags ? meal.strTags.split(',') : [],
      videoUrl: meal.strYoutube || null,
      websiteUrl: meal.strSource || null,
      ingredients: extractIngredients(meal),
    }));

    res.status(200).json(formattedMeals);
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }
  return ingredients;
}
