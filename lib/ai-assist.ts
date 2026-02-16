export type AiAssistInstruction = {
  type: "navigate"
  route: string
  selector?: string
  title?: string
  message?: string
}

export const AI_ASSIST_STORAGE_KEY = "civis_ai_assist"
export const AI_ASSIST_EVENT = "civis-ai-assist-updated"

export const readAiAssistInstruction = (): AiAssistInstruction | null => {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AI_ASSIST_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AiAssistInstruction
  } catch {
    return null
  }
}

export const writeAiAssistInstruction = (instruction: AiAssistInstruction) => {
  if (typeof window === "undefined") return
  localStorage.setItem(AI_ASSIST_STORAGE_KEY, JSON.stringify(instruction))
  window.dispatchEvent(new CustomEvent(AI_ASSIST_EVENT))
}

export const clearAiAssistInstruction = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(AI_ASSIST_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(AI_ASSIST_EVENT))
}
