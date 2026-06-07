"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
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
  locked?: boolean
  lockedTitle?: string
  lockedDescription?: string
}

export function RecordDetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  sections,
  locked = false,
  lockedTitle = "Details unavailable",
  lockedDescription = "Your current role can access this module, but not the underlying record details.",
}: RecordDetailsDialogProps) {
  const safeValue = (value: ReactNode) => {
    if (value === null || value === undefined || value === "") return "—"
    return value
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(92vw,52rem)] flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <div className="border-b border-border px-6 pb-4 pt-6">
            <DialogTitle>{locked ? lockedTitle : title}</DialogTitle>
            {locked ? (
              <DialogDescription>{lockedDescription}</DialogDescription>
            ) : description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {locked ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Sensitive fields are redacted for this role. Ask a workspace administrator with manage access if you need
              to review or export this record.
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <section key={section.title || index} className="space-y-3">
                  {section.title ? <h3 className="text-sm font-semibold text-foreground">{section.title}</h3> : null}
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {section.fields.map((field) => (
                      <div
                        key={`${section.title || "section"}-${field.label}`}
                        className="rounded-lg border border-border p-3"
                      >
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {field.label}
                        </dt>
                        <dd className="mt-1 break-words text-sm text-foreground">{safeValue(field.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" className="w-full bg-transparent sm:w-auto" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
