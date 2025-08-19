// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_MEALDB_API_KEY?: string;
  readonly VITE_HUGGINGFACE_TOKEN?: string;
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_OFFLINE_MODE?: string;
  readonly VITE_INTENSIVE_LOGGING?: string;
  // Debug logging environment variables
  readonly VITE_DEBUG_LOGGING?: string;
  readonly VITE_DEBUG_LEVEL?: string;
  readonly VITE_DEBUG_TIMING?: string;
  readonly VITE_DEBUG_STACKS?: string;
  readonly VITE_DEBUG_USER_CONTEXT?: string;
  readonly VITE_DEBUG_NETWORK?: string;
  readonly VITE_DEBUG_STATE?: string;
  readonly VITE_DEBUG_PERFORMANCE?: string;
  readonly VITE_DEBUG_CONSOLE?: string;
  readonly VITE_DEBUG_STORAGE?: string;
  readonly VITE_DEBUG_MAX_LOGS?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
