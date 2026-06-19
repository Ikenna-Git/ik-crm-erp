"use client"

import { useEffect, useRef, useState } from "react"

export type CursorStyle = "system" | "command" | "precision"

export const CIVIS_CURSOR_STORAGE_KEY = "civis_cursor_style"
export const CIVIS_CURSOR_EVENT = "civis-cursor-style-change"

const readStoredStyle = (): CursorStyle => {
  if (typeof window === "undefined") return "command"
  const raw = window.localStorage.getItem(CIVIS_CURSOR_STORAGE_KEY)
  if (raw === "system" || raw === "command" || raw === "precision") return raw
  return "command"
}

export function CivisCursor() {
  const [style, setStyle] = useState<CursorStyle>("command")
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const pointRef = useRef({ x: 0, y: 0 })
  const visibleRef = useRef(false)
  const enabledRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const next = readStoredStyle()
    setStyle(next)

    const sync = () => setStyle(readStoredStyle())
    window.addEventListener(CIVIS_CURSOR_EVENT, sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CIVIS_CURSOR_EVENT, sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const root = document.documentElement
    const cursor = cursorRef.current
    if (!cursor) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fine = window.matchMedia("(pointer: fine)")
    const enabled = style !== "system" && fine.matches && !reduced.matches
    enabledRef.current = enabled
    root.dataset.cursorStyle = enabled ? style : "system"

    if (!enabled) {
      cursor.style.opacity = "0"
      return () => {
        delete root.dataset.cursorStyle
      }
    }

    const update = () => {
      frameRef.current = null
      cursor.style.transform = `translate3d(${pointRef.current.x}px, ${pointRef.current.y}px, 0)`
      cursor.style.opacity = visibleRef.current ? "1" : "0"
    }

    const onMove = (event: PointerEvent) => {
      if (!enabledRef.current) return
      pointRef.current = { x: event.clientX, y: event.clientY }
      visibleRef.current = true
      const target = event.target instanceof Element ? event.target : null
      const closestInput = target?.closest("input, textarea, select, [contenteditable='true'], pre, code")
      if (closestInput) {
        root.dataset.cursorState = "hidden"
      } else if (target?.closest("[data-cursor='lock']")) {
        root.dataset.cursorState = "lock"
      } else if (target?.closest("a, button, [role='button'], [data-cursor='link']")) {
        root.dataset.cursorState = "link"
      } else if (target?.closest("[data-cursor='card']")) {
        root.dataset.cursorState = "card"
      } else {
        root.dataset.cursorState = "default"
      }
      if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(update)
    }

    const onLeave = () => {
      visibleRef.current = false
      root.dataset.cursorState = "default"
      if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(update)
    }

    const onVisibility = () => {
      if (document.hidden) {
        visibleRef.current = false
        if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(update)
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerleave", onLeave)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("visibilitychange", onVisibility)
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current)
      delete root.dataset.cursorStyle
      delete root.dataset.cursorState
    }
  }, [style])

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-[opacity,width,height,filter] duration-200 ease-out motion-reduce:hidden md:block"
    >
      <div className="civis-cursor-shell relative h-full w-full">
        <div className="civis-cursor-core absolute inset-0 rounded-full border border-primary/60 bg-primary/8 backdrop-blur-[2px]" />
        <div className="civis-cursor-dot absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_18px_rgba(76,139,255,0.55)]" />
        <div className="civis-cursor-trail absolute inset-1 rounded-full border border-accent/35" />
      </div>
    </div>
  )
}
