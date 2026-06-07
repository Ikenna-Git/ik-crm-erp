"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type DetailField = {
  label: string
  value: ReactNode
}

type DetailSection = {
  title?: string
  fields: DetailField[]
}

type RecordDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  sections: DetailSection[]
}

export function RecordDetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  sections,
}: RecordDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-6">
          {sections.map((section, index) => (
            <section key={section.title || index} className="space-y-3">
              {section.title ? <h3 className="text-sm font-semibold text-foreground">{section.title}</h3> : null}
              <dl className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={`${section.title || "section"}-${field.label}`} className="rounded-lg border border-border p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</dt>
                    <dd className="mt-1 break-words text-sm text-foreground">{field.value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
