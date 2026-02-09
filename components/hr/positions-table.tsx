"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MoreHorizontal, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export type Position = {
  id: string
  title: string
  department: string
  headcount: number
  status: "open" | "filled" | "paused"
  updatedAt: string
}

const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"]
const titles = [
  "Senior Developer",
  "Account Executive",
  "Product Designer",
  "HR Manager",
  "Finance Analyst",
  "Ops Coordinator",
]

const buildMockPositions = (count: number): Position[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `POS-${(idx + 1).toString().padStart(3, "0")}`,
    title: titles[idx % titles.length],
    department: departments[idx % departments.length],
    headcount: (idx % 6) + 1,
    status: (["open", "filled", "paused"] as const)[idx % 3],
    updatedAt: new Date(2025, idx % 12, (idx % 27) + 1).toISOString().slice(0, 10),
  }))

const statusStyles: Record<Position["status"], string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  filled: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
}

type PositionsTableProps = {
  positions?: Position[]
  onAddPosition?: (data: Omit<Position, "id">) => void
  onUpdatePosition?: (id: string, data: Omit<Position, "id">) => void
  onDeletePosition?: (id: string) => void
}

export function PositionsTable({
  positions: providedPositions,
  onAddPosition,
  onUpdatePosition,
  onDeletePosition,
}: PositionsTableProps) {
  const [positions, setPositions] = useState<Position[]>(providedPositions || buildMockPositions(70))
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    department: "",
    headcount: "1",
    status: "open" as Position["status"],
  })

  useEffect(() => {
    if (providedPositions) setPositions(providedPositions)
  }, [providedPositions])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const totalPages = Math.max(1, Math.ceil(positions.length / pageSize))
  const pagedPositions = positions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openEditor = (position?: Position) => {
    if (position) {
      setEditingId(position.id)
      setForm({
        title: position.title,
        department: position.department,
        headcount: String(position.headcount),
        status: position.status,
      })
    } else {
      setEditingId(null)
      setForm({ title: "", department: "", headcount: "1", status: "open" })
    }
    setShowModal(true)
  }

  const savePosition = (event: React.FormEvent) => {
    event.preventDefault()
    const payload: Omit<Position, "id"> = {
      title: form.title || "Role",
      department: form.department || "Operations",
      headcount: Number(form.headcount || 1),
      status: form.status,
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    if (editingId) {
      onUpdatePosition?.(editingId, payload)
      setPositions((prev) => prev.map((pos) => (pos.id === editingId ? { id: editingId, ...payload } : pos)))
    } else {
      onAddPosition?.(payload)
      setPositions((prev) => [{ id: Date.now().toString(), ...payload }, ...prev])
    }
    setShowModal(false)
  }

  const handleDeletePosition = (id: string) => {
    onDeletePosition?.(id)
    setPositions((prev) => prev.filter((pos) => pos.id !== id))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Positions ({positions.length})</CardTitle>
            <CardDescription>Manage open roles and headcount targets.</CardDescription>
          </div>
          <Button size="sm" onClick={() => openEditor()} className="flex items-center gap-2">
            Add Position
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Headcount</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Updated</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedPositions.map((position) => (
                  <tr key={position.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-medium">{position.title}</td>
                    <td className="py-4 px-4">{position.department}</td>
                    <td className="py-4 px-4">{position.headcount}</td>
                    <td className="py-4 px-4">
                      <Badge className={statusStyles[position.status]}>{position.status}</Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{position.updatedAt}</td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditor(position)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePosition(position.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Position" : "Add Position"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePosition} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Role title</label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Senior Developer"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Input
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value })}
                    placeholder="Engineering"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Headcount</label>
                  <Input
                    type="number"
                    value={form.headcount}
                    onChange={(event) => setForm({ ...form, headcount: event.target.value })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as Position["status"] })}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  >
                    <option value="open">Open</option>
                    <option value="filled">Filled</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingId ? "Save Position" : "Add Position"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
