# 🌐 Offline Mode Guide

## **How to Enable Offline Mode**

### **Option 1: Environment Variable**
Add this to your `.env.local` file:
```
VITE_OFFLINE_MODE=true
```

### **Option 2: Temporary Testing**
You can temporarily set the flag in `src/utils/constants.ts`:
```typescript
export const IS_OFFLINE_MODE = true; // Force offline mode
```

## **What Works Offline:**

### **✅ Fully Functional:**
- **Navigation** - All screens and routing
- **UI/UX** - Animations, forms, interactions
- **Mock Data** - Sample recipes and meals
- **Search** - Filters mock data locally
- **Recipe Hub** - Shows mock discovery, saved, and meals
- **My Meals** - Shows mock meal data

### **✅ Simulated Actions:**
- **Save Recipe** - Shows success message (data not persisted)
- **Delete Recipe** - Removes from UI temporarily
- **Add Meal** - Shows success message (data not persisted)
- **Update Meal Status** - Shows success message

## **What Doesn't Work Offline:**

### **❌ External APIs:**
- **MealDB API** - No real recipe discovery
- **Supabase Database** - No data persistence
- **Supabase Auth** - No user authentication

### **❌ Data Persistence:**
- All changes are temporary
- Data resets when you refresh the page
- No real user accounts or saved data

## **Testing Offline Mode:**

1. **Enable offline mode** using one of the methods above
2. **Restart your dev server** (`npm run dev`)
3. **Navigate the app** - everything should work with mock data
4. **Test interactions** - save/delete recipes, add meals
5. **Check all screens** - Recipe Hub, My Meals, etc.

## **Mock Data Included:**

### **Sample Recipes:**
- **Chicken Pasta** - Italian cuisine
- **Greek Salad** - Mediterranean dish

### **Sample Meals:**
- **Breakfast** - Chicken Pasta (planned)
- **Lunch** - Greek Salad (cooked)

## **Development Benefits:**

- **UI Testing** - Test all screens without internet
- **Demo Mode** - Show app functionality to others
- **Development** - Work on UI without API dependencies
- **Presentations** - Reliable demo without network issues

## **Switching Back to Online:**

1. **Remove the environment variable** or set to `false`
2. **Restart your dev server**
3. **Ensure internet connection**
4. **Test with real data**

## **Troubleshooting:**

- **Mock data not showing?** - Check `IS_OFFLINE_MODE` is `true`
- **Still getting API errors?** - Restart the dev server
- **UI not updating?** - Clear browser cache

---

**Note:** Offline mode is for development and testing only. Real data persistence requires internet connection and Supabase.
