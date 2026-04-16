export type StyleGuide =
  | "google"
  | "microsoft"
  | "apple"
  | "stripe"
  | "custom";

export type Audience =
  | "developer"
  | "end-user"
  | "pm"
  | "executive"
  | "mixed";

export type Surface =
  | "help-center"
  | "api-doc"
  | "chatbot"
  | "readme"
  | "internal-wiki";

export type Provider = "gemini" | "openrouter";

export const PROVIDER_LABELS: Record<Provider, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

export type GeminiModel =
  | "gemini-2.5-flash-preview-05-20"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export const GEMINI_MODEL_LABELS: Record<GeminiModel, string> = {
  "gemini-2.5-flash-preview-05-20": "Gemini 2.5 Flash (Preview)",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
  "gemini-1.5-flash": "Gemini 1.5 Flash",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
};

export type OpenRouterModel =
  | "nvidia/nemotron-3-super-120b-a12b:free"
  | "openai/gpt-oss-120b:free"
  | "google/gemma-4-31b-it:free"
  | "qwen/qwen3-coder:free"
  | "qwen/qwen3-next-80b-a3b-instruct:free";

export const OPENROUTER_MODEL_LABELS: Record<OpenRouterModel, string> = {
  "nvidia/nemotron-3-super-120b-a12b:free": "NVIDIA Nemotron 3 Super 120B (Free)",
  "openai/gpt-oss-120b:free": "OpenAI GPT-OSS 120B (Free)",
  "google/gemma-4-31b-it:free": "Google Gemma 4 31B (Free)",
  "qwen/qwen3-coder:free": "Qwen 3 Coder 480B (Free)",
  "qwen/qwen3-next-80b-a3b-instruct:free": "Qwen 3 Next 80B (Free)",
};

export interface DocSettings {
  styleGuide: StyleGuide;
  audience: Audience;
  surface: Surface;
  provider: Provider;
  geminiModel: GeminiModel;
  openrouterModel: OpenRouterModel;
  customStyleGuidePrompt?: string;
}

export interface GeneratedDoc {
  id: string;
  title: string;
  markdown: string;
  settings: DocSettings;
  createdAt: number;
  sourcePreview: string;
}

export const STYLE_GUIDE_LABELS: Record<StyleGuide, string> = {
  google: "Google Developer Docs",
  microsoft: "Microsoft Style Guide",
  apple: "Apple Style Guide",
  stripe: "Stripe Docs Style",
  custom: "Custom Style Guide",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  developer: "Developers",
  "end-user": "End Users",
  pm: "Product Managers",
  executive: "Executives",
  mixed: "Mixed / General",
};

export const SURFACE_LABELS: Record<Surface, string> = {
  "help-center": "Help Center Article",
  "api-doc": "API Documentation",
  chatbot: "Chatbot Knowledge Base",
  readme: "README / Guide",
  "internal-wiki": "Internal Wiki",
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
