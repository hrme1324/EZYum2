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
  readonly DEV: boolean;
  readonly PROD: boolean;
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
