export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.MEALDB_API_KEY || '1'; // MealDB has a public API
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/${apiKey}/random.php`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const meal = data.meals?.[0];
    if (!meal) {
      return res.status(404).json({ error: 'No recipe found' });
    }

    const formattedMeal = {
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      image: meal.strMealThumb,
      tags: meal.strTags ? meal.strTags.split(',') : [],
      videoUrl: meal.strYoutube || null,
      websiteUrl: meal.strSource || null,
      ingredients: extractIngredients(meal)
    };

    res.status(200).json(formattedMeal);
  } catch (error) {
    console.error('Random recipe error:', error);
    res.status(500).json({ error: 'Failed to get random recipe' });
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
        measure: measure ? measure.trim() : ''
      });
    }
  }
  return ingredients;
}
