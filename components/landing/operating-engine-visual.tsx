"use client"

import type { CSSProperties } from "react"
import { useEffect, useRef } from "react"
import {
  Bot,
  BriefcaseBusiness,
  FolderKanban,
  HeartPulse,
  Package,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react"

type ModuleNode = {
  id: string
  label: string
  status: "ready" | "limited" | "action-required" | "preview-only"
  icon: typeof BriefcaseBusiness
  x: number
  y: number
  locked?: boolean
}

const modules: ModuleNode[] = [
  { id: "crm", label: "CRM", status: "ready", icon: BriefcaseBusiness, x: 50, y: 8 },
  { id: "accounting", label: "Accounting", status: "limited", icon: ReceiptText, x: 83, y: 28, locked: true },
  { id: "operations", label: "Operations", status: "ready", icon: Workflow, x: 83, y: 67 },
  { id: "projects", label: "Projects", status: "limited", icon: FolderKanban, x: 50, y: 87 },
  { id: "inventory", label: "Inventory", status: "limited", icon: Package, x: 17, y: 68 },
  { id: "hr", label: "HR", status: "limited", icon: HeartPulse, x: 17, y: 28, locked: true },
  { id: "ai", label: "AI", status: "ready", icon: Bot, x: 50, y: 50 },
]

const signalPaths = [
  { id: "lead", from: { x: 50, y: 8 }, mid: { x: 58, y: 22 }, to: { x: 50, y: 50 }, delay: "0s", label: "Lead" },
  { id: "invoice", from: { x: 50, y: 50 }, mid: { x: 68, y: 36 }, to: { x: 83, y: 28 }, delay: "1.25s", label: "Invoice" },
  { id: "approval", from: { x: 83, y: 28 }, mid: { x: 83, y: 46 }, to: { x: 83, y: 67 }, delay: "2.1s", label: "Approval" },
]

const trustCards = [
  { title: "Civis Pulse", detail: "See what needs action, what is blocked, and what is ready.", tone: "ready" },
  { title: "Privacy locks", detail: "HR and Accounting remain protected until an authorized manager unlocks them.", tone: "limited" },
  { title: "Founder trust", detail: "Route guards, org boundaries, and readiness evidence stay visible.", tone: "action-required" },
]

export function OperatingEngineVisual() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const shell = shellRef.current
    if (!shell || typeof window === "undefined") return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pointerMedia = window.matchMedia("(pointer: fine)")
    if (media.matches || !pointerMedia.matches) {
      shell.style.setProperty("--mx", "0px")
      shell.style.setProperty("--my", "0px")
      shell.style.setProperty("--glow-x", "50%")
      shell.style.setProperty("--glow-y", "50%")
      return
    }

    let nextX = 0
    let nextY = 0
    let active = false
    let rect = shell.getBoundingClientRect()

    const update = () => {
      frameRef.current = null
      if (!active) return
      shell.style.setProperty("--mx", `${nextX}px`)
      shell.style.setProperty("--my", `${nextY}px`)
    }

    const syncRect = () => {
      rect = shell.getBoundingClientRect()
    }

    const onMove = (event: PointerEvent) => {
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const offsetX = ((x / rect.width) - 0.5) * 12
      const offsetY = ((y / rect.height) - 0.5) * 12
      nextX = offsetX
      nextY = offsetY
      shell.style.setProperty("--glow-x", `${Math.max(0, Math.min(100, (x / rect.width) * 100))}%`)
      shell.style.setProperty("--glow-y", `${Math.max(0, Math.min(100, (y / rect.height) * 100))}%`)
      active = true
      if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(update)
    }

    const onLeave = () => {
      active = true
      nextX = 0
      nextY = 0
      shell.style.setProperty("--glow-x", "50%")
      shell.style.setProperty("--glow-y", "50%")
      if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(update)
    }

    const onEnter = () => syncRect()
    const onResize = () => syncRect()
    const onVisibility = () => {
      if (document.hidden) {
        active = false
        nextX = 0
        nextY = 0
        shell.style.setProperty("--mx", "0px")
        shell.style.setProperty("--my", "0px")
      }
    }

    syncRect()
    shell.addEventListener("pointerenter", onEnter)
    shell.addEventListener("pointermove", onMove)
    shell.addEventListener("pointerleave", onLeave)
    window.addEventListener("resize", onResize)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      shell.removeEventListener("pointerenter", onEnter)
      shell.removeEventListener("pointermove", onMove)
      shell.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVisibility)
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <div
      ref={shellRef}
      aria-hidden="true"
      data-cursor="card"
      className="landing-engine relative isolate overflow-hidden rounded-[34px] border border-border/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.78))] p-4 shadow-[0_24px_72px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(160deg,rgba(17,17,19,0.96),rgba(26,26,29,0.94))] sm:p-6"
      style={
        {
          "--mx": "0px",
          "--my": "0px",
          "--glow-x": "50%",
          "--glow-y": "50%",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),rgba(76,139,255,0.12),transparent_20%),linear-gradient(180deg,rgba(76,139,255,0.04),transparent_40%),linear-gradient(90deg,rgba(61,214,140,0.04),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative min-h-[520px] overflow-hidden rounded-[28px] border border-white/50 bg-slate-950/[0.035] p-4 dark:border-white/8 dark:bg-white/[0.02]">
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: "translate3d(calc(var(--mx) * -0.18), calc(var(--my) * -0.18), 0)" }}
          >
            <div className="landing-ring absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/16" />
            <div className="landing-ring absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/16 [animation-duration:24s]" />
          </div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {modules.map((node) =>
              modules
                .filter((target) => target.id !== node.id && target.id !== "ai" && node.id === "ai")
                .map((target) => (
                  <line
                    key={`${node.id}-${target.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="rgba(100,116,139,0.26)"
                    strokeWidth="0.22"
                    strokeDasharray="1.1 1.8"
                  />
                )),
            )}
            {signalPaths.map((path) => (
              <g key={path.id}>
                <path
                  d={`M ${path.from.x} ${path.from.y} Q ${path.mid.x} ${path.mid.y} ${path.to.x} ${path.to.y}`}
                  fill="none"
                  stroke="rgba(76,139,255,0.38)"
                  strokeWidth="0.45"
                  strokeDasharray="1.8 1.8"
                />
                <circle r="0.85" fill="rgba(61,214,140,0.82)">
                  <animateMotion
                    dur="8.5s"
                    begin={path.delay}
                    repeatCount="indefinite"
                    path={`M ${path.from.x} ${path.from.y} Q ${path.mid.x} ${path.mid.y} ${path.to.x} ${path.to.y}`}
                  />
                </circle>
              </g>
            ))}
          </svg>

          <div
            className="absolute left-1/2 top-1/2 z-20 w-[min(74vw,320px)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out"
            style={{ transform: "translate3d(calc(-50% + var(--mx) * 0.32), calc(-50% + var(--my) * 0.32), 0)" }}
          >
            <div data-cursor="card" className="rounded-[30px] border border-primary/20 bg-slate-950 px-5 py-5 text-white shadow-[0_16px_44px_rgba(15,23,42,0.3)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300">Civis operating engine</p>
                  <p className="mt-2 text-2xl font-semibold">Command core</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">Next best action</p>
                  <p className="mt-2 font-medium text-white">Review invoice approval before close</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">Trust posture</p>
                  <div className="mt-2 flex items-center gap-2 font-medium text-white">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Org boundaries enforced
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-3 py-1 text-emerald-200">Ready</span>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-amber-100">Limited</span>
                <span className="rounded-full border border-rose-300/25 bg-rose-300/12 px-3 py-1 text-rose-100">Action required</span>
                <span className="rounded-full border border-sky-300/25 bg-sky-300/12 px-3 py-1 text-sky-100">Preview only</span>
              </div>
            </div>
          </div>

          {modules
            .filter((node) => node.id !== "ai")
            .map((node) => {
              const Icon = node.icon
              return (
                <div
                  key={node.id}
                  data-cursor={node.locked ? "lock" : "card"}
                  className="absolute z-10 w-[108px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out sm:w-[118px]"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: `translate3d(calc(-50% + var(--mx) * ${((node.x - 50) / 120).toFixed(3)}), calc(-50% + var(--my) * ${((node.y - 50) / 120).toFixed(3)}), 0)`,
                  }}
                >
                  <div className="rounded-3xl border border-border/80 bg-background/88 p-3 shadow-lg backdrop-blur dark:bg-slate-950/88">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          node.status === "ready"
                            ? "bg-emerald-500"
                            : node.status === "limited"
                              ? "bg-amber-400"
                              : node.status === "preview-only"
                                ? "bg-sky-400"
                                : "bg-rose-400"
                        }`}
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">{node.label}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{node.status.replace("-", " ")}</p>
                    {node.locked ? (
                      <div className="mt-2 rounded-full border border-border/80 px-2 py-1 text-[11px] text-muted-foreground">Privacy locked</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
        </div>

        <div className="grid gap-4">
          <div
            data-cursor="card"
            className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm transition-transform duration-300"
            style={{ transform: "translate3d(calc(var(--mx) * 0.14), calc(var(--my) * 0.14), 0)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Watch work move</p>
            <h3 className="mt-3 text-2xl font-semibold text-foreground">CRM, finance, people, operations, and AI connected in one governed workspace.</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Civis turns scattered business activity into guided workflows. Work enters once, moves through the right module, and stays accountable.
            </p>
          </div>

          {trustCards.map((card, index) => (
            <div
              key={card.title}
              data-cursor="card"
              className="rounded-[26px] border border-border/80 bg-card/90 p-4 shadow-sm transition-transform duration-300"
              style={{
                transform: `translate3d(calc(var(--mx) * ${0.08 + index * 0.03}), calc(var(--my) * ${0.08 + index * 0.03}), 0)`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-foreground">{card.title}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${
                    card.tone === "ready"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : card.tone === "limited"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {card.tone.replace("-", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
