# 🍽️ Ezyum - Smart Meal Planning for Students

**A time-saving, emotionally engaging meal-planning app for college students**

## 🎯 Mission

Ezyum simplifies meal planning, cooking, and shopping for college students through automation, personalization, and intuitive design.

## ⚡ Key Features

### 🚀 Time-Saving Features (Ranked by Value)
- **📷 Vision-Based Pantry Capture** - Take a photo, detect ingredients via AI
- **🧠 AI Meal Recommendations** - Matches recipes to your pantry, skill, time
- **📅 Drag & Drop Meal Planner** - Visually schedule meals with minimal taps
- **🛒 Smart Grocery Lists** - Fills only what you're missing for meals
- **🥡 Leftovers Optimizer** - Turns leftovers into new meals
- **🎮 Gamified Meal Challenge** - Plan 3 meals in under 30 seconds

### 🎨 Design System
- **Colors**: Warm, emotional palette with coral blush, sage leaf, and off-white
- **Typography**: Lora (headings) + Inter (body) for warmth and readability
- **Mobile-First**: Optimized for <3s load time and intuitive mobile experience

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern component architecture
- **Vite** - Lightning-fast build tooling
- **Tailwind CSS** - Design system and theming
- **Zustand** - Local state management
- **React Query** - Data fetching with Supabase hooks
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing

### Backend
- **Supabase** - Database, auth, and real-time features
- **PostgreSQL** - Relational data storage with RLS
- **Supabase Auth** - Email & Google login
- **Supabase Storage** - Pantry photos, recipe images

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ezyum-food-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_MEALDB_API_KEY=your_mealdb_key
   VITE_HUGGINGFACE_TOKEN=your_huggingface_token
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Features Overview

### 🧑‍🍳 Onboarding Flow (4 Screens)
1. **Time Budget Slider** - "How long does meal prep usually take?"
2. **Pantry Staples Picker** - Chip-select common ingredients
3. **30-Second Meal Game** - Swipe meals into your plan
4. **Chef Profile Creation** - "Continue with Google" → Save and sync

### 🎮 Gamification Elements
- **Streaks** - Daily cooking streak, tracked visually
- **XP System** - Earn XP by cooking, planning, sharing
- **Badges** - Unlock for milestones: 7-day streak, 5 recipes shared
- **Surprise Meals** - Randomly unlocked "Mystery Meals"

### 📊 Data Model (Supabase + RLS)
```sql
-- Users table
users (id, email, created_at)

-- Pantry items
pantry_items (id, user_id, name, category, quantity, expiration, source)

-- Meals and recipes
meals (id, user_id, date, meal_type, recipe_id, status)
recipes (id, user_id, name, source_url, ingredients, cook_time, equipment)

-- Shopping and social
grocery_lists (id, user_id, items, status, created_at)
social_posts (id, user_id, meal_id, image_url, caption, likes, comments)
```

## 🎨 Color Palette

| Role                | Name               | Hex       |
| ------------------- | ------------------ | --------- |
| Background Light    | Off-White Canvas   | `#F8F5F0` |
| Background Dark     | Off-Black Slate    | `#1E1E1D` |
| Text Primary        | Rich Charcoal      | `#33322E` |
| Text Secondary      | Soft Taupe         | `#7E7A6E` |
| CTA Buttons         | Coral Blush        | `#E48A68` |
| Accent Tabs         | Sage Leaf          | `#9BAA92` |
| Highlight/Success   | Mint Sprig Light   | `#D3E3D0` |
| Errors              | Burnt Sienna       | `#B25A3C` |
| Promo Tags          | Wheat Gold         | `#D4AF37` |

## 📁 Project Structure

```
src/
├── api/           # Supabase & AI integrations
├── components/    # UI components (buttons, cards, planners)
├── features/      # Feature modules (pantry, meal planner, grocery)
├── screens/       # Pages (Onboarding, Home, Social)
├── state/         # Zustand store
├── styles/        # Tailwind config, global CSS
├── types/         # TypeScript types & enums
└── utils/         # Helpers, formatters, constants
```

## 🔐 Security & Privacy

- **RLS Policies** - All user data is protected with Row Level Security
- **Modular Architecture** - Feature flags for social features and AI types
- **Data-Resilient UX** - Handles offline, slow internet, and empty states
- **Privacy-Respecting** - Social features are opt-in and modular

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_MEALDB_API_KEY=your_mealdb_key
VITE_HUGGINGFACE_TOKEN=your_token
```

## 🧪 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Basic app structure and routing
- ✅ Onboarding flow
- ✅ Authentication with Supabase
- 🔄 Pantry management
- 🔄 Meal planning interface
- 🔄 AI recipe recommendations

### Phase 2 (Social Features)
- 📱 Social feed with meal sharing
- 💬 Recipe likes & comments
- 👥 "Cooked Together" tracker
- 📸 Share to Instagram/Snapchat
- 🤝 Collaborative meal planning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons

---

**Built with ❤️ for college students who want to cook better, faster, and more consistently.** 