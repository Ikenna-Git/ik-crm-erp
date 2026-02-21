export type AiProvider = "openai" | "anthropic" | "gemini"
export type AiMessage = { role: "system" | "user" | "assistant"; content: string }

type ProviderConfig = {
  provider: AiProvider
  apiKey: string
  model: string
  temperature: number
}

const parseTemperature = (value: string | undefined) => {
  if (!value) return 0.3
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0.3
}

export const resolveProvider = (override?: string | null): ProviderConfig | null => {
  const normalizedOverride = (override || "").toLowerCase()
  const preferred =
    normalizedOverride && normalizedOverride !== "auto" ? normalizedOverride : (process.env.AI_PROVIDER || "").toLowerCase()
  const temperature = parseTemperature(process.env.AI_TEMPERATURE)
  const modelFor = (provider: AiProvider, fallback: string) => {
    const perProviderModel =
      provider === "openai"
        ? process.env.AI_MODEL_OPENAI
        : provider === "anthropic"
          ? process.env.AI_MODEL_ANTHROPIC
          : process.env.AI_MODEL_GEMINI
    return perProviderModel || process.env.AI_MODEL || fallback
  }

  const configs: Record<AiProvider, ProviderConfig | null> = {
    openai: process.env.OPENAI_API_KEY
      ? {
          provider: "openai",
          apiKey: process.env.OPENAI_API_KEY,
          model: modelFor("openai", "gpt-4o-mini"),
          temperature,
        }
      : null,
    anthropic: process.env.ANTHROPIC_API_KEY
      ? {
          provider: "anthropic",
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: modelFor("anthropic", "claude-3-5-sonnet-20240620"),
          temperature,
        }
      : null,
    gemini: process.env.GEMINI_API_KEY
      ? {
          provider: "gemini",
          apiKey: process.env.GEMINI_API_KEY,
          model: modelFor("gemini", "gemini-1.5-flash"),
          temperature,
        }
      : null,
  }

  if (preferred && (preferred === "openai" || preferred === "anthropic" || preferred === "gemini")) {
    return configs[preferred] || null
  }

  return configs.openai || configs.anthropic || configs.gemini || null
}

const extractSystem = (messages: AiMessage[]) => {
  const system = messages.find((message) => message.role === "system")?.content || ""
  const rest = messages.filter((message) => message.role !== "system")
  return { system, rest }
}

export const callProvider = async (config: ProviderConfig, messages: AiMessage[]) => {
  if (config.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        messages,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI request failed")
    }
    return data?.choices?.[0]?.message?.content?.trim() || ""
  }

  if (config.provider === "anthropic") {
    const { system, rest } = extractSystem(messages)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        system,
        temperature: config.temperature,
        max_tokens: 800,
        messages: rest.map((message) => ({ role: message.role, content: message.content })),
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error?.message || "Anthropic request failed")
    }
    return data?.content?.[0]?.text?.trim() || ""
  }

  const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n")
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: config.temperature },
      }),
    },
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed")
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
}
