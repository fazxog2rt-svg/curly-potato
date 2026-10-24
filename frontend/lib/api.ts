const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "/api"
    : "http://127.0.0.1:8000/api");

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Get token if stored
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("study_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // Ignore JSON parse errors on failure
    }
    throw new ApiError(errorMsg, response.status, errorData);
  }

  // Check if content-type is json
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export const api = {
  // Auth
  auth: {
    me: () => fetchWithAuth("/auth/me"),
    updateProfile: (data: any) =>
      fetchWithAuth("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  },

  // AI & Models
  ai: {
    getModels: (refresh = false) => fetchWithAuth(`/ai/models?refresh=${refresh}`),
    chat: (payload: any) =>
      fetchWithAuth("/ai/chat", { method: "POST", body: JSON.stringify(payload) }),
    getStreamUrl: () => `${API_BASE}/ai/chat/stream`,
    generateMindmap: (content: string, model?: string) =>
      fetchWithAuth("/ai/mindmap", { method: "POST", body: JSON.stringify({ content, model }) }),
    generateCheatsheet: (content: string, subject = "Umum", model?: string) =>
      fetchWithAuth("/ai/cheatsheet", { method: "POST", body: JSON.stringify({ content, subject, model }) }),
    generateMotivation: (category = "islamic", context?: string, model?: string) =>
      fetchWithAuth("/ai/motivation", {
        method: "POST",
        body: JSON.stringify({ category, context, model }),
      }),
  },

  // Conversations
  conversations: {
    list: () => fetchWithAuth("/conversations"),
    create: (data: any) =>
      fetchWithAuth("/conversations", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => fetchWithAuth(`/conversations/${id}`),
    rename: (id: string, title: string) =>
      fetchWithAuth(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
    delete: (id: string) => fetchWithAuth(`/conversations/${id}`, { method: "DELETE" }),
  },

  // Materials & Documents
  materials: {
    list: (subjectId?: string) =>
      fetchWithAuth(`/materials${subjectId ? `?subject_id=${subjectId}` : ""}`),
    upload: (formData: FormData) =>
      fetchWithAuth("/materials/upload", { method: "POST", body: formData }),
    get: (id: string) => fetchWithAuth(`/materials/${id}`),
    delete: (id: string) => fetchWithAuth(`/materials/${id}`, { method: "DELETE" }),
    summarize: (id: string) =>
      fetchWithAuth(`/materials/${id}/summarize`, { method: "POST" }),
    ask: (id: string, question: string, model?: string) =>
      fetchWithAuth(`/materials/${id}/ask`, {
        method: "POST",
        body: JSON.stringify({ question, model }),
      }),
    getSubjects: () => fetchWithAuth("/materials/subjects"),
    createSubject: (data: any) =>
      fetchWithAuth("/materials/subjects", { method: "POST", body: JSON.stringify(data) }),
  },

  // Notes
  notes: {
    list: (materialId?: string) =>
      fetchWithAuth(`/notes${materialId ? `?material_id=${materialId}` : ""}`),
    create: (data: any) =>
      fetchWithAuth("/notes", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => fetchWithAuth(`/notes/${id}`),
    update: (id: string, data: any) =>
      fetchWithAuth(`/notes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/notes/${id}`, { method: "DELETE" }),
  },

  // Quiz Center
  quizzes: {
    list: () => fetchWithAuth("/quizzes"),
    generate: (data: any) =>
      fetchWithAuth("/quizzes/generate", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => fetchWithAuth(`/quizzes/${id}`),
    submit: (id: string, answers: any[]) =>
      fetchWithAuth(`/quizzes/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    attempts: (id: string) => fetchWithAuth(`/quizzes/${id}/attempts`),
  },

  // Smart Review
  reviews: {
    due: () => fetchWithAuth("/reviews/due"),
    all: () => fetchWithAuth("/reviews/all"),
    create: (data: any) =>
      fetchWithAuth("/reviews/cards", { method: "POST", body: JSON.stringify(data) }),
    answer: (id: string, rating: number) =>
      fetchWithAuth(`/reviews/${id}/answer`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
    delete: (id: string) => fetchWithAuth(`/reviews/${id}`, { method: "DELETE" }),
  },

  // Study Planner
  planner: {
    getGoals: () => fetchWithAuth("/study-plans/goals"),
    createGoal: (data: any) =>
      fetchWithAuth("/study-plans/goals", { method: "POST", body: JSON.stringify(data) }),
    deleteGoal: (id: string) =>
      fetchWithAuth(`/study-plans/goals/${id}`, { method: "DELETE" }),
    getTasks: (goalId?: string) =>
      fetchWithAuth(`/study-plans/tasks${goalId ? `?goal_id=${goalId}` : ""}`),
    createTask: (data: any) =>
      fetchWithAuth("/study-plans/tasks", { method: "POST", body: JSON.stringify(data) }),
    toggleTask: (id: string) =>
      fetchWithAuth(`/study-plans/tasks/${id}/toggle`, { method: "PATCH" }),
    deleteTask: (id: string) =>
      fetchWithAuth(`/study-plans/tasks/${id}`, { method: "DELETE" }),
    suggest: (data: any) =>
      fetchWithAuth("/study-plans/suggest", { method: "POST", body: JSON.stringify(data) }),
  },

  // Personal Learning Memory
  memory: {
    list: () => fetchWithAuth("/memory"),
    create: (data: any) =>
      fetchWithAuth("/memory", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth(`/memory/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/memory/${id}`, { method: "DELETE" }),
  },

  // Analytics
  analytics: {
    overview: () => fetchWithAuth("/analytics/overview"),
    logSession: (data: any) =>
      fetchWithAuth("/analytics/session", { method: "POST", body: JSON.stringify(data) }),
  },

  // System Settings
  settings: {
    get: () => fetchWithAuth("/settings"),
    testAI: () => fetchWithAuth("/settings/test-ai", { method: "POST" }),
  },

  // Knowledge Graph & Bayesian Knowledge Tracing (BKT)
  knowledgeGraph: {
    getNodes: (subject?: string) =>
      fetchWithAuth(`/knowledge-graph/nodes${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`),
    updateMastery: (node_id: string, is_correct: boolean) =>
      fetchWithAuth("/knowledge-graph/update-mastery", {
        method: "POST",
        body: JSON.stringify({ node_id, is_correct }),
      }),
    diagnose: (node_id: string) => fetchWithAuth(`/knowledge-graph/diagnose/${node_id}`),
  },

  // Computerized Adaptive Testing (CAT) - IRT 3PL Engine
  catExam: {
    start: (subject = "Matematika") =>
      fetchWithAuth("/cat-exam/start", {
        method: "POST",
        body: JSON.stringify({ subject }),
      }),
    submitAnswer: (session_id: string, question_id: string, selected_option: string) =>
      fetchWithAuth("/cat-exam/submit-answer", {
        method: "POST",
        body: JSON.stringify({ session_id, question_id, selected_option }),
      }),
    history: () => fetchWithAuth("/cat-exam/history"),
  },

  // Autonomous Multi-Agent Study Co-Pilot (ReAct Framework)
  agentCopilot: {
    execute: (user_prompt: string, model?: string) =>
      fetchWithAuth("/agent-copilot/execute", {
        method: "POST",
        body: JSON.stringify({ user_prompt, model }),
      }),
    applyPlan: (mission_title: string, actionable_plan: any[], generated_flashcards?: any[]) =>
      fetchWithAuth("/agent-copilot/apply-mission", {
        method: "POST",
        body: JSON.stringify({ mission_title, actionable_plan, generated_flashcards }),
      }),
  },
};
