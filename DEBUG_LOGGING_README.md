# 🐛 EZYUM EXTENSIVE DEBUG LOGGING SYSTEM

## 🚀 Quick Start

### Enable Debug Logging

1. **Copy debug variables to `.env.local`:**

   ```bash
   cp debug-config.env .env.local
   ```

2. **Or set individual variables:**

   ```bash
   VITE_DEBUG_LOGGING=true
   VITE_DEBUG_LEVEL=detailed
   ```

3. **Restart your dev server**

4. **Click the 🐛 button** in the bottom-right corner to open the debug panel

## 🎯 What Gets Logged

### 📊 **Recipes Page**

- Recipe fetching operations
- Search queries and filters
- Recipe loading states
- Error handling for missing data
- Performance metrics for large lists

### 🛒 **Grocery Page**

- List loading and saving
- Item additions/removals
- Network requests to Supabase
- State synchronization
- Error handling for failed operations

### 🥫 **Pantry Page**

- Item CRUD operations
- Category filtering
- Search functionality
- Data persistence issues
- Performance during bulk operations

### 🔐 **Authentication**

- Login/logout flows
- Token management
- Session state changes
- Error handling for auth failures
- Redirect logic

### 🌐 **Network Operations**

- All Supabase API calls
- Response times and status codes
- Error responses and retries
- Request payloads and headers

### ⚡ **Performance**

- Component render times
- Memory usage monitoring
- Long-running tasks (>50ms)
- Slow network requests
- React re-render patterns

## 🎛️ Debug Control Panel

### **Configuration Tab**

- **Enable/Disable**: Turn logging on/off instantly
- **Log Level**: Choose between basic, detailed, or verbose
- **Timing**: Include operation duration measurements
- **Stack Traces**: Include full error stack traces
- **User Context**: Include user ID, auth status, current page
- **Network Details**: Include API call details
- **State Changes**: Log React state updates
- **Performance**: Monitor memory and render times
- **Console Output**: Show logs in browser console
- **Storage**: Persist logs in localStorage

### **Logs Tab**

- View all logged events in real-time
- Filter by log level and category
- See timing information for operations
- Expand details for full context
- Export logs as JSON file

### **Errors Tab**

- Focus on error and critical logs
- View stack traces for debugging
- Export error logs for analysis
- Track error patterns over time

### **Performance Tab**

- Monitor slow operations
- Track memory usage trends
- Identify performance bottlenecks
- Export performance data

## 🔧 Environment Variables

| Variable                  | Default | Description                    |
| ------------------------- | ------- | ------------------------------ |
| `VITE_DEBUG_LOGGING`      | `false` | Enable/disable debug logging   |
| `VITE_DEBUG_LEVEL`        | `basic` | Logging detail level           |
| `VITE_DEBUG_TIMING`       | `false` | Include timing information     |
| `VITE_DEBUG_STACKS`       | `false` | Include stack traces           |
| `VITE_DEBUG_USER_CONTEXT` | `false` | Include user context           |
| `VITE_DEBUG_NETWORK`      | `false` | Include network details        |
| `VITE_DEBUG_STATE`        | `false` | Include state changes          |
| `VITE_DEBUG_PERFORMANCE`  | `false` | Include performance monitoring |
| `VITE_DEBUG_CONSOLE`      | `true`  | Log to browser console         |
| `VITE_DEBUG_STORAGE`      | `false` | Store logs in localStorage     |
| `VITE_DEBUG_MAX_LOGS`     | `1000`  | Maximum logs to store          |

## 📝 Usage Examples

### **Basic Logging**

```typescript
import { recipeInfo, recipeError } from '../utils/debug';

// Log recipe operations
recipeInfo('fetch_recipes', 'Fetching recipes for user', { userId, limit: 20 });

// Log errors with context
recipeError('save_recipe', 'Failed to save recipe', { recipeId, error: err.message });
```

### **Timing Operations**

```typescript
import { startTimer, endTimer, recipeInfo } from '../utils/debug';

const timerId = startTimer('fetch_recipes');
try {
  const recipes = await fetchRecipes();
  const duration = endTimer(timerId);
  recipeInfo('fetch_recipes', 'Recipes fetched successfully', { count: recipes.length, duration });
} catch (error) {
  endTimer(timerId);
  recipeError('fetch_recipes', 'Failed to fetch recipes', { error: error.message });
}
```

### **Component Logging Hook**

```typescript
import { useDebugLogger } from '../utils/debug';

function RecipeList() {
  const logger = useDebugLogger('recipes', 'RecipeList');

  useEffect(() => {
    logger.info('component_mount', 'RecipeList component mounted');

    const timerId = logger.startTimer('fetch_recipes');
    fetchRecipes().then(() => {
      logger.endTimer(timerId);
    });
  }, []);

  return <div>...</div>;
}
```

## 🎨 Customization

### **Adding New Categories**

```typescript
// In debug.ts, add new category methods
public customDebug(operation: string, message: string, details?: any, timerId?: string) {
  this.debug('custom', operation, message, details, timerId);
}
```

### **Custom Log Formats**

```typescript
// Override outputToConsole method for custom formatting
private outputToConsole(entry: LogEntry) {
  // Custom format here
  console.log(`[${entry.category}] ${entry.message}`, entry.details);
}
```

## 🚨 Troubleshooting

### **Debug Panel Not Showing**

- Check if `VITE_DEBUG_LOGGING=true` is set
- Ensure you're in development mode
- Check browser console for errors

### **Logs Not Appearing**

- Verify `VITE_DEBUG_CONSOLE=true`
- Check log level settings
- Ensure category matches log level

### **Performance Impact**

- Use `basic` level for production debugging
- Disable timing and performance monitoring
- Reduce max storage logs

### **Storage Issues**

- Check localStorage quota
- Reduce `VITE_DEBUG_MAX_LOGS`
- Clear logs periodically

## 📊 Log Analysis

### **Common Patterns**

- **Slow Operations**: Look for timing > 100ms
- **Error Clusters**: Group errors by category and operation
- **Performance Degradation**: Monitor memory usage trends
- **Network Issues**: Check response times and error rates

### **Export and Analysis**

- Export logs as JSON for external analysis
- Use log viewer tools for large datasets
- Filter by date, category, or log level
- Track user journey through operations

## 🔒 Security Considerations

- **User Context**: Only log non-sensitive user data
- **Network Details**: Avoid logging sensitive headers or tokens
- **Storage**: Logs are stored locally, not transmitted
- **Production**: Disable detailed logging in production builds

## 🚀 Production Deployment

### **Recommended Production Settings**

```bash
VITE_DEBUG_LOGGING=false
VITE_DEBUG_LEVEL=basic
VITE_DEBUG_TIMING=false
VITE_DEBUG_STACKS=false
VITE_DEBUG_PERFORMANCE=false
VITE_DEBUG_STORAGE=false
```

### **Conditional Debugging**

```typescript
// Only enable in development or when explicitly requested
if (import.meta.env.DEV || localStorage.getItem('enable_debug') === 'true') {
  debugLogger.enable();
}
```

## 📚 API Reference

### **Core Functions**

- `debug(category, operation, message, details?, timerId?)`
- `info(category, operation, message, details?, timerId?)`
- `warn(category, operation, message, details?, timerId?)`
- `error(category, operation, message, details?, timerId?)`
- `critical(category, operation, message, details?, timerId?)`

### **Category-Specific Functions**

- `recipeDebug/info/warn/error(operation, message, details?, timerId?)`
- `groceryDebug/info/warn/error(operation, message, details?, timerId?)`
- `pantryDebug/info/warn/error(operation, message, details?, timerId?)`
- `authDebug/info/warn/error(operation, message, details?, timerId?)`
- `networkDebug/info/warn/error(operation, message, details?, timerId?)`

### **Utility Functions**

- `startTimer(operation): string`
- `endTimer(timerId): number | null`
- `getLogs(): LogEntry[]`
- `exportLogs(): string`
- `clearLogs(): void`
- `enable()/disable()`
- `setLevel(level)`

### **React Hook**

- `useDebugLogger(category, componentName)`

---

**🎯 This debug system provides comprehensive visibility into every aspect of your EZYUM app, making it easy to identify and resolve issues quickly!**
