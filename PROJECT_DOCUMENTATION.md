# Ezyum Food App - Project Documentation

## 📋 Project Overview

**Ezyum Food App** is a React-based meal planning and recipe management application with a focus on simplicity and user experience. The app helps users manage their pantry, plan meals, browse recipes, and organize their grocery shopping.

**Current Version:** 1.3.0
**Last Updated:** July 28, 2025
**Status:** Production Ready - Simplified & Clean

---

## 🏗️ Architecture

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router
- **Animations:** Framer Motion
- **UI Components:** Lucide React Icons

### Backend

- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **API:** Express.js Server (Local Development) → Vercel Serverless Functions (Production)
- **External APIs:** MealDB (recipe database), OpenAI (AI recipe suggestions), Hugging Face (food categorization)

### Security

- **Row Level Security (RLS):** Enabled on all tables
- **API Key Protection:** Sensitive keys stored on backend only
- **CORS:** Configured for production domains

### Deployment Architecture

#### Development Environment

- **Frontend:** Vite dev server on `http://localhost:3000`
- **Backend:** Express.js server on `http://localhost:3001`
- **Database:** Supabase (cloud)

#### Production Environment (Vercel)

- **Frontend:** Vercel static build deployment
- **Backend:** Vercel serverless functions (converted from Express.js)
- **Database:** Supabase (cloud)
- **API Routes:** `/api/*` → Vercel serverless functions
- **Static Assets:** Served directly by Vercel
- **SPA Routing:** All non-API routes → `index.html`

---

## 🗄️ Database Schema

### Core Tables

1. **pantry_items** - User's pantry inventory
2. **user_settings** - User preferences and settings
3. **user_allergens** - User's food allergies
4. **user_appliances** - User's cooking appliances
5. **meals** - Planned meals
6. **recipes** - User's saved recipes
7. **grocery_lists** - Shopping lists with persistence

### RLS Policies

- All tables have `FOR ALL` policies ensuring users can only access their own data
- Policies use `auth.uid() = user_id` pattern

---

## 🚀 Key Features

### ✅ Implemented Features

#### 0. **Full-Stack Deployment (Vercel)**

- **Express.js to Serverless:** Converted Express.js server to Vercel serverless functions
- **API Routes:** All backend endpoints available at `/api/*`
- **Environment Variables:** Secure API key management
- **CORS Configuration:** Proper cross-origin handling
- **Error Handling:** Comprehensive error responses
- **Health Checks:** `/api/health` endpoint for monitoring

**API Endpoints:**

- `GET /api/health` - Server health check
- `POST /api/ai/recipe-suggestions` - OpenAI-powered recipe suggestions
- `POST /api/ai/food-categorization` - Hugging Face food classification
- `GET /api/recipes/search` - MealDB recipe search (proxy)
- `GET /api/recipes/random` - MealDB random recipe (proxy)

#### 1. **Authentication System**

- Google OAuth integration via Supabase
- Protected routes and user-specific data
- Automatic user session management

#### 2. **Pantry Management**

- Add/edit/delete pantry items
- Barcode scanning integration (Open Food Facts API)
- Camera access for mobile scanning
- Category-based organization
- Expiration date tracking

#### 3. **Recipe Browsing System** ⭐

- **MealDB Integration:** Access to thousands of recipes
- **Search Functionality:** Find recipes by name or ingredients
- **Category Filtering:** Filter by cuisine type
- **Random Recipes:** Discover new recipes
- **Video Support:** Embedded YouTube videos
- **Website Links:** Direct links to recipe sources
- **Recipe Cards:** Beautiful, detailed recipe display

#### 4. **Meal Planning System** ⭐

- **Weekly Planning:** Plan meals for entire weeks
- **Quick Week Generation:** Auto-generate meal plans
- **Individual Meal Addition:** Add specific meals to any day
- **Meal Types:** Breakfast, lunch, dinner, snacks
- **Recipe Integration:** Link meals to recipes
- **Visual Calendar:** Week view with meal counts

#### 5. **Settings & Preferences**

- Time budget configuration (slider with debouncing)
- Notification preferences
- Dark mode toggle
- Allergen management
- Cooking appliance tracking

#### 6. **Enhanced Onboarding System**

- Time budget assessment with working sliders
- Interactive game component
- User preference collection
- Achievement tracking
- Automatic preference saving

#### 7. **Profile Management**

- User statistics and achievements
- Settings management with improved sliders
- Allergen and appliance tracking

#### 8. **Recipe Display System**

- Beautiful recipe cards with images
- Video embedding support (YouTube)
- Website link integration
- Detailed ingredient lists
- Difficulty and cooking time display

#### 9. **Working Quick Actions**

- Functional navigation buttons
- Direct routing to key features
- Responsive design

#### 10. **Persistent Grocery Lists** ⭐

- Database-backed grocery list persistence
- Real-time updates and synchronization
- Category-based organization
- Progress tracking
- Add/remove/check items
- Clear completed items functionality

---

## 🔧 Technical Implementation

### API Services

1. **RecipeService** - Recipe browsing and search (MealDB-based)
2. **PantryService** - Pantry CRUD operations
3. **SettingsService** - User settings management with debouncing
4. **MealService** - Meal planning operations
5. **BarcodeService** - Product scanning
6. **GroceryService** - Grocery list persistence with Supabase

### Vercel Serverless Functions

- `/api/health` - Health check
- `/api/recipes/search` - MealDB search with video/website support
- `/api/recipes/random` - Random recipes with video/website support

## 🔧 Port Configuration & Deployment Setup

### Port Configuration Issue (RESOLVED)

**Problem:** The application was experiencing 404 errors when loading recipes due to incorrect port configuration between frontend and backend.

**Root Cause:**

1. **Frontend Default:** Vite dev server runs on port 3000, but falls back to 3001, then 3002
2. **Backend Default:** Express server configured for port 3001
3. **URL Mismatch:** Frontend was trying to access `http://localhost:3000/api/api/recipes/random` (double `/api/` path)
4. **Port Conflict:** Multiple servers trying to use port 3001

**Solution:**

- Updated `BACKEND_URL` in `src/api/aiService.ts` to use `http://localhost:3001/api`
- Removed duplicate `/api/` paths from API calls
- Fixed port allocation to prevent conflicts

### Deployment Architecture

**Local Development:**

```
Frontend: http://localhost:3002/     ← Your web app
Backend:  http://localhost:3001/api  ← Your API server
```

**Production (Vercel):**

```
Frontend: https://your-app.vercel.app/           ← Your web app
Backend:  https://your-app.vercel.app/api/       ← Your API (same domain!)
```

**Key Differences:**

- **Local:** Separate ports for frontend and backend
- **Production:** Same domain, different paths
- **Environment Variables:** Handle the URL differences automatically

### Local Development Setup

**Frontend (Port 3002):**

```bash
npm run dev
# Runs on http://localhost:3002
```

**Backend (Port 3001):**

```bash
cd server && npm start
# Runs on http://localhost:3001
```

**Environment Configuration:**

**Frontend (.env.local):**

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_BACKEND_URL=http://localhost:3001/api
VITE_ANALYTICS_ID=your_analytics_id_here
```

**Backend (server/.env):**

```
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003
MEALDB_API_KEY=your_mealdb_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### Vercel Deployment Configuration

**Frontend Deployment:**

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**Environment Variables for Vercel Frontend:**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=https://your-backend-domain.vercel.app/api
VITE_ANALYTICS_ID=your_analytics_id
```

**Backend Deployment (Vercel Functions):**

- **Framework Preset:** Node.js
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Output Directory:** `api`

**Environment Variables for Vercel Backend:**

```
MEALDB_API_KEY=your_mealdb_api_key
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

### API Endpoint Structure

**Local Development:**

- Frontend: `http://localhost:3002`
- Backend: `http://localhost:3001/api`
- API Calls: `http://localhost:3001/api/recipes/random`

**Production (Vercel):**

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.vercel.app/api`
- API Calls: `https://your-backend.vercel.app/api/recipes/random`

### Environment Variables

**Frontend (Safe to expose):**

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_BACKEND_URL
VITE_ANALYTICS_ID
```

**Backend (Secure):**

```
MEALDB_API_KEY (optional - public API available)
PORT
NODE_ENV
ALLOWED_ORIGINS
```

### Troubleshooting Common Issues

#### 1. **Port Already in Use Error**

```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

```bash
# Find and kill the process using port 3001
lsof -i :3001
kill <PID>

# Or use a different port
PORT=3003 npm start
```

#### 2. **API 404 Errors**

**Symptoms:** `api/api/recipes/random:1 Failed to load resource: 404`
**Causes:**

- Incorrect `VITE_BACKEND_URL` configuration
- Double `/api/` path in API calls
- Backend server not running

**Solution:**

- Verify `VITE_BACKEND_URL=http://localhost:3001/api` in `.env.local`
- Ensure backend server is running on port 3001
- Check API calls don't have duplicate `/api/` paths

#### 3. **CORS Errors**

**Symptoms:** `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3002' has been blocked by CORS policy`
**Solution:**

- Update `ALLOWED_ORIGINS` in backend `.env` to include your frontend port
- Restart backend server after changing CORS settings

#### 4. **Environment Variables Not Loading**

**Symptoms:** API calls using default values instead of environment variables
**Solution:**

- Ensure `.env.local` file exists in project root
- Restart development server after adding environment variables
- Check variable names start with `VITE_` for frontend

#### 5. **Vercel Deployment Issues**

**Symptoms:** API calls failing in production
**Solution:**

- Set correct `VITE_BACKEND_URL` for production domain
- Ensure backend is deployed as Vercel Functions
- Check environment variables are set in Vercel dashboard

---

## 🎯 Recipe Browsing System

### MealDB Integration

- **Recipe Database:** Access to thousands of recipes
- **Search API:** Find recipes by name or ingredients
- **Random API:** Discover new recipes
- **Video Support:** YouTube video embedding
- **Website Links:** Direct links to recipe sources

### Recipe Display Features

- **Recipe Cards:** Beautiful, detailed display
- **Category Filtering:** Filter by cuisine type
- **Search Functionality:** Find specific recipes
- **Video Embedding:** Watch recipe videos
- **Website Links:** Visit original recipe sources

### User Experience

- **Loading States:** Smooth loading indicators
- **Error Handling:** Graceful error recovery
- **Empty States:** Helpful empty state messages
- **Responsive Design:** Works on all devices

---

## 🐛 Recent Fixes & Improvements

### ✅ Resolved Issues

#### 1. **AI Complexity Removal**

- **Issue:** AI features were complex and unreliable
- **Solution:** Completely removed AI dependencies and simplified to MealDB-only
- **Status:** ✅ Fixed

#### 2. **Browse Recipes Implementation**

- **Issue:** No dedicated recipe browsing page
- **Solution:** Created comprehensive BrowseRecipes page with search and filtering
- **Status:** ✅ Fixed

#### 3. **Plan Week Functionality**

- **Issue:** Plan Week button had no functionality
- **Solution:** Implemented full week planning with auto-generation
- **Status:** ✅ Fixed

#### 4. **Database Table Issues**

- **Issue:** `smart_suggestions` table missing from database
- **Solution:** Removed smart suggestions completely
- **Status:** ✅ Fixed

#### 5. **API Import Errors**

- **Issue:** API files trying to import axios causing build errors
- **Solution:** Switched to native fetch API for serverless functions
- **Status:** ✅ Fixed

#### 6. **Grocery List Persistence**

- **Issue:** Grocery list changes not saving to database
- **Solution:** Created GroceryService with full CRUD operations
- **Status:** ✅ Fixed

#### 7. **Quick Actions Not Working**

- **Issue:** Navigation buttons not functional
- **Solution:** Added proper navigation with useNavigate hook
- **Status:** ✅ Fixed

#### 8. **Settings Slider Issues**

- **Issue:** Multiple "Settings updated" messages and slider not working
- **Solution:** Added debouncing to prevent rapid updates and fixed slider CSS
- **Status:** ✅ Fixed

#### 9. **Recipe Display**

- **Issue:** Recipes not displaying properly
- **Solution:** Created comprehensive RecipeCard component with video/website support
- **Status:** ✅ Fixed

#### 10. **Onboarding Sliders**

- **Issue:** Sliders not working in onboarding process
- **Solution:** Fixed slider CSS and added proper state management
- **Status:** ✅ Fixed

#### 11. **User Data Persistence**

- **Issue:** New user data not being saved properly
- **Solution:** Enhanced onboarding to save preferences and achievements
- **Status:** ✅ Fixed

### 🔄 Current Status

#### 1. **Production Ready**

- **Status:** All major features working with database persistence
- **API:** Simplified and stable (MealDB only)
- **UI:** Responsive and functional
- **Database:** Properly configured with all tables
- **No AI Dependencies:** Clean, simple architecture

---

## 📱 User Experience

### Mobile-First Design

- Responsive layout for all screen sizes
- Touch-friendly interface
- Camera integration for barcode scanning
- Optimized for mobile performance

### Accessibility

- High contrast colors
- Clear typography
- Keyboard navigation support
- Screen reader compatibility

### Performance

- Lazy loading of components
- Optimized bundle size
- Efficient database queries
- Caching strategies

---

## 🚀 Deployment

### Vercel Configuration

- **Frontend:** Static build with React
- **Backend:** Serverless functions with proper API routing
- **Database:** Supabase (external)
- **Domain:** Custom domain support

### Environment Setup

1. **Frontend Variables:** Set in Vercel dashboard
2. **Backend Variables:** Minimal configuration needed
3. **Database:** Run SQL schema in Supabase
4. **Authentication:** Configure Google OAuth

---

## 📈 Future Enhancements

### Planned Features

1. **Recipe Sharing** - Share recipes with other users
2. **Nutrition Tracking** - Calorie and macro tracking
3. **Social Features** - Follow other users and share meals
4. **Advanced Recipe Search** - More sophisticated filtering
5. **Meal Photos** - Upload and share meal photos
6. **Voice Commands** - Voice-controlled meal planning

### Technical Improvements

1. **Caching Strategy** - Implement Redis for better performance
2. **Real-time Updates** - WebSocket integration
3. **Offline Support** - Service worker for offline functionality
4. **Push Notifications** - Meal reminders and suggestions
5. **Analytics** - User behavior tracking

---

## 🔍 Development Notes

### Code Quality

- **TypeScript:** Strict type checking enabled
- **ESLint:** Code quality enforcement
- **Prettier:** Consistent code formatting
- **Husky:** Pre-commit hooks

### Testing Strategy

- **Unit Tests:** Component and service testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** User flow testing
- **Performance Tests:** Load testing for features

### Monitoring

- **Error Tracking:** Console error logging
- **Performance:** Bundle size monitoring
- **User Analytics:** Feature usage tracking
- **API Monitoring:** Response time and error rates

---

## 📞 Support & Maintenance

### Error Handling

- **Frontend:** Toast notifications for user feedback
- **Backend:** Comprehensive error logging
- **Database:** Connection error handling
- **API:** Rate limiting and fallback strategies

### Backup Strategy

- **Database:** Supabase automatic backups
- **Code:** GitHub repository
- **Environment:** Vercel deployment history
- **Configuration:** Environment variable backups

---

## 🎯 Success Metrics

### User Engagement

- Daily active users
- Recipe browsing frequency
- Pantry item count
- Meal planning frequency

### Technical Performance

- Page load times
- API response times
- Error rates
- Bundle size

### Business Metrics

- User retention
- Feature adoption
- User satisfaction
- Platform stability

---

## 🔄 Recent Updates (v1.3.0)

### Major Improvements

1. **AI Removal** - Completely removed AI dependencies for simplicity
2. **Browse Recipes** - New comprehensive recipe browsing page
3. **Plan Week** - Full week meal planning functionality
4. **Recipe Integration** - MealDB integration with video/website support
5. **Clean Architecture** - Simplified codebase without AI complexity
6. **Enhanced UX** - Better user experience with working features

### Technical Fixes

1. **Database Schema** - Updated with all required tables
2. **API Simplification** - Removed complex external dependencies
3. **State Management** - Better persistence and synchronization
4. **Error Recovery** - Graceful fallbacks for all features
5. **Performance** - Optimized database queries and caching

### Database Tables

1. **pantry_items** - User pantry inventory
2. **user_settings** - User preferences
3. **user_allergens** - Food allergies
4. **user_appliances** - Cooking appliances
5. **meals** - Planned meals
6. **recipes** - Saved recipes
7. **grocery_lists** - Shopping lists

### Removed Features

1. **Smart Suggestions** - Removed AI-powered suggestions
2. **AI Services** - Removed OpenAI and Hugging Face dependencies
3. **Complex APIs** - Simplified to MealDB only

---

## Recent Deployment Fixes and Changes (2025-08)

- **Auth redirect fixed**: Implemented robust redirect URL detection via `getAuthBaseUrl()` and `VITE_SITE_URL`. Production redirects to `https://ezyum.com/auth/callback`; local uses `http://localhost:3000/auth/callback`.
- **Supabase config**: Added `VITE_SITE_URL` variable; documented required Supabase redirect URLs and Google OAuth URIs. See `SUPABASE_AUTH_SETUP.md`.
- **Vercel routing**: Resolved MIME type error by serving static assets directly using route `{ "src": "/(.*\\..*)", "dest": "/$1" }` and SPA catch‑all to `index.html`.
- **API 404 on `/api/recipes/random`**: Fixed by deploying backend as Vercel Serverless (Express) and exporting `module.exports = app`; updated `vercel.json` to route `/api/(.*)` to `server/server.js`.
- **vercel.json strategy**: Documented two approaches and final choice.
  - Option A: `functions` block (modern).
  - Option B: `builds` entries for `@vercel/static-build` + `@vercel/node`.
  - We currently use the `builds` approach to avoid conflicts and let frontend build be explicit.
- **Node version**: Added `"engines": { "node": "18.x" }` to `package.json` to align Vercel runtime.
- **Frontend API base URL**: `src/api/aiService.ts` now logs and resolves `BACKEND_URL` to `/api` on production and `http://localhost:3001/api` in dev.
- **GitHub Actions (CI/CD)**:
  - Removed artifact upload/download; Vercel Action builds itself.
  - Added explicit `VERCEL_TOKEN` env, `vercel whoami` debug step, and CLI fallback (`npx vercel --prod --token=$VERCEL_TOKEN`).
  - Kept tokens/org/project IDs via secrets.
- **Lint/format stability**: Relaxed ESLint rules, kept Prettier, and ensured `npm run build` green.
- **UI**: Restored the original Home page design with animations and quick actions.

### Current vercel.json (builds approach)

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "server/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/server.js" },
    { "src": "/(.*\\..*)", "dest": "/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Key environment variables

- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_BACKEND_URL` (dev only: `http://localhost:3001/api`).
- Backend (serverless): `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`, `MEALDB_API_KEY`, `ALLOWED_ORIGINS`, `NODE_ENV`.

### Known issues resolved

- Strict MIME type error on production assets → fixed via static asset route.
- OAuth redirect to localhost after login → fixed via `VITE_SITE_URL` and runtime domain detection.
- 404s for `/api/recipes/random` in production → fixed by serverless routing and export.
- Vercel “You must re-authenticate” in GitHub Actions → fixed via explicit token env, debug step, and CLI fallback.

_This document is automatically updated with each major development session. Last updated: July 28, 2025 - v1.3.0_
