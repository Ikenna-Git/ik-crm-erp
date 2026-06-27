"use client"

import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export type CrmFieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "SELECT"
  | "MULTISELECT"
  | "CHECKBOX"
  | "URL"
  | "EMAIL"
  | "PHONE"
  | "USER"

export type CrmField = {
  id: string
  key: string
  name: string
  type: CrmFieldType
  options?: string[] | null
  required?: boolean
  visible?: boolean
  section?: string | null
  helpText?: string | null
}

export const normalizeOptions = (options?: string[] | string | null) => {
  if (Array.isArray(options)) return options.filter(Boolean)
  if (typeof options === "string") {
    return options
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export const formatCustomFieldValue = (value: unknown) => {
  if (Array.isArray(value)) return value.join(", ")
  if (value === true) return "Yes"
  if (value === false) return "No"
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

type CustomFieldInputProps = {
  field: CrmField
  value: any
  onChange: (value: any) => void
}

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  const options = normalizeOptions(field.options)

  if (field.type === "CHECKBOX") {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Toggle</span>
        <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => onChange(Boolean(checked))} />
      </div>
    )
  }

  if (field.type === "SELECT") {
    return (
      <select
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select {field.name}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === "MULTISELECT") {
    const selected = Array.isArray(value) ? value : []
    return (
      <div className="space-y-2">
        {options.length === 0 && (
          <Input
            placeholder="Comma separated values"
            value={Array.isArray(value) ? value.join(", ") : value || ""}
            onChange={(event) =>
              onChange(
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        )}
        {options.map((option) => {
          const checked = selected.includes(option)
          return (
            <label key={option} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => {
                  if (next) {
                    onChange([...selected, option])
                  } else {
                    onChange(selected.filter((item) => item !== option))
                  }
                }}
              />
              <span>{option}</span>
            </label>
          )
        })}
      </div>
    )
  }

  if (field.type === "LONG_TEXT") {
    return (
      <Textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.helpText || field.name}
        className="min-h-[110px]"
      />
    )
  }

  const inputType =
    field.type === "DATE"
      ? "date"
      : field.type === "NUMBER" || field.type === "CURRENCY"
        ? "number"
        : field.type === "EMAIL"
          ? "email"
          : field.type === "PHONE"
            ? "tel"
            : field.type === "URL"
              ? "url"
              : "text"

  return (
    <Input
      type={inputType}
      value={value ?? ""}
      onChange={(event) => {
        const nextValue =
          field.type === "NUMBER" || field.type === "CURRENCY" ? Number(event.target.value || 0) : event.target.value
        onChange(nextValue)
      }}
      placeholder={field.type === "DATE" ? "YYYY-MM-DD" : field.helpText || field.name}
    />
  )
}
