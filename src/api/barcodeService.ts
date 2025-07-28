import { BarcodeProduct } from '../types';

// Open Food Facts API endpoint
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product';

// Fallback product data for when API is unavailable
const FALLBACK_PRODUCTS: Record<string, BarcodeProduct> = {
  '123456789': {
    code: '123456789',
    name: 'Organic Whole Milk',
    brand: 'Local Dairy',
    category: 'dairy',
    ingredients: ['organic whole milk'],
    allergens: ['milk'],
    nutrition: {
      calories: 150,
      protein: 8,
      carbs: 12,
      fat: 8,
    },
  },
  '987654321': {
    code: '987654321',
    name: 'Whole Grain Bread',
    brand: 'Artisan Bakery',
    category: 'grains',
    ingredients: ['whole wheat flour', 'water', 'salt', 'yeast'],
    allergens: ['wheat', 'gluten'],
    nutrition: {
      calories: 80,
      protein: 3,
      carbs: 15,
      fat: 1,
    },
  },
};

export class BarcodeService {
  private static cache = new Map<string, BarcodeProduct>();

  /**
   * Scan a barcode and return product information
   */
  static async scanBarcode(barcode: string): Promise<BarcodeProduct | null> {
    try {
      // Check cache first
      if (this.cache.has(barcode)) {
        console.log('Returning cached product:', barcode);
        return this.cache.get(barcode)!;
      }

      // Check fallback products first (for testing)
      const fallbackProduct = FALLBACK_PRODUCTS[barcode];
      if (fallbackProduct) {
        console.log('Found fallback product:', fallbackProduct.name);
        this.cache.set(barcode, fallbackProduct);
        return fallbackProduct;
      }

      // Try Open Food Facts API
      const product = await this.fetchFromOpenFoodFacts(barcode);
      if (product) {
        console.log('Found product from API:', product.name);
        this.cache.set(barcode, product);
        return product;
      }

      console.log('No product found for barcode:', barcode);
      return null;
    } catch (error) {
      console.error('Barcode scanning error:', error);

      // Return fallback product if available
      const fallbackProduct = FALLBACK_PRODUCTS[barcode];
      if (fallbackProduct) {
        console.log('Returning fallback product after error:', fallbackProduct.name);
        return fallbackProduct;
      }

      return null;
    }
  }

  /**
   * Fetch product data from Open Food Facts API
   */
  private static async fetchFromOpenFoodFacts(barcode: string): Promise<BarcodeProduct | null> {
    try {
      const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Open Food Facts API rate limited');
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.product || data.status === 0) {
        return null;
      }

      const product = data.product;

      return {
        code: barcode,
        name: product.product_name || product.generic_name || 'Unknown Product',
        brand: product.brands,
        category: this.categorizeProduct(product),
        ingredients: product.ingredients_text_parsed || [],
        allergens: product.allergens_tags || [],
        nutrition: {
          calories: product.nutriments?.energy_100g,
          protein: product.nutriments?.proteins_100g,
          carbs: product.nutriments?.carbohydrates_100g,
          fat: product.nutriments?.fat_100g,
        },
      };
    } catch (error) {
      console.error('Open Food Facts API error:', error);
      return null;
    }
  }

  /**
   * Categorize product based on Open Food Facts data
   */
  private static categorizeProduct(product: any): string {
    const categories = product.categories_tags || [];
    const categoryString = categories.join(' ').toLowerCase();

    if (categoryString.includes('dairy') || categoryString.includes('milk')) {
      return 'dairy';
    }
    if (categoryString.includes('meat') || categoryString.includes('fish')) {
      return 'protein';
    }
    if (categoryString.includes('vegetable') || categoryString.includes('fruit')) {
      return 'produce';
    }
    if (categoryString.includes('grain') || categoryString.includes('bread')) {
      return 'grains';
    }
    if (categoryString.includes('spice') || categoryString.includes('sauce')) {
      return 'condiments';
    }

    return 'other';
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached product count
   */
  static getCacheSize(): number {
    return this.cache.size;
  }
}
