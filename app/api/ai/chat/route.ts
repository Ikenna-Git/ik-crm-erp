import { NextResponse } from "next/server"
import { resolveProvider, callProvider, type AiMessage } from "@/lib/ai/providers"
import { buildFallbackResponse } from "@/lib/ai/fallback"
import { findKnowledge } from "@/lib/ai/knowledge"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

type AiMode = "qna" | "summary" | "email" | "tour"

const normalizeMessages = (messages: any[]): AiMessage[] =>
  messages
    .filter((message) => message && typeof message.content === "string" && typeof message.role === "string")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
      content: message.content,
    }))

const buildSystemPrompt = (mode: AiMode, userName: string, orgName: string, knowledge?: string) => {
  const base = `You are Civis AI, the in-app assistant for a CRM/ERP platform. Be concise, helpful, and action-oriented. Use NGN for currency and keep responses under 180 words unless asked for more. Address the user as ${userName}.`
  const modePrompt = {
    qna: "Answer questions about Civis features and best practices. Offer next steps.",
    summary: "Summarize the provided business metrics and suggest 1-2 next actions.",
    email: "Draft a professional email based on the provided context. Include a clear subject line.",
    tour: "Give a short guided tour of Civis modules in numbered steps.",
  }[mode]

  const knowledgeBlock = knowledge ? `\nRelevant Civis context: ${knowledge}` : ""
  return `${base}\n${modePrompt}${knowledgeBlock}\nOrg: ${orgName || "Civis"}.`
}

export async function POST(request: Request) {
  try {
    const limit = rateLimit(getRateLimitKey(request, "ai"), { limit: 30, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json().catch(() => ({}))
    const mode = (body?.mode || "qna") as AiMode
    let providerPreference =
      typeof body?.provider === "string" && body.provider.trim() ? body.provider.trim() : undefined
    const incoming = Array.isArray(body?.messages) ? normalizeMessages(body.messages) : []
    const lastUserMessage = [...incoming].reverse().find((msg) => msg.role === "user")?.content || ""
    const knowledge = lastUserMessage ? findKnowledge(lastUserMessage)?.content : undefined
    const systemPrompt = buildSystemPrompt(mode, user?.name || "there", org?.name || "", knowledge)
    const messages: AiMessage[] = [{ role: "system", content: systemPrompt }, ...incoming]

    if (!providerPreference && process.env.DATABASE_URL) {
      try {
        const settings = await prisma.userSettings.findUnique({
          where: { userId: user.id },
          select: { aiProvider: true },
        })
        if (settings?.aiProvider) providerPreference = settings.aiProvider
      } catch (error) {
        console.warn("Failed to load AI provider preference", error)
      }
    }

    const provider = resolveProvider(providerPreference)
    let reply = ""

    try {
      if (provider) {
        reply = await callProvider(provider, messages)
      } else {
        reply = buildFallbackResponse(mode, lastUserMessage, body?.context, user?.name || "there")
      }
    } catch (error: any) {
      console.error("AI provider failed, using fallback.", error)
      reply = buildFallbackResponse(mode, lastUserMessage, body?.context, user?.name || "there")
    }

    try {
      await createAuditLog({
        orgId: org.id,
        userId: user.id,
        action: "Civis AI request",
        entity: "AI",
        entityId: `${mode}-${Date.now()}`,
        metadata: { mode },
      })
    } catch (auditError) {
      console.warn("Failed to write AI audit log", auditError)
    }

    return NextResponse.json({
      message: reply,
      provider: provider?.provider || "fallback",
      mode,
    })
  } catch (error) {
    console.error("AI chat failed", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
