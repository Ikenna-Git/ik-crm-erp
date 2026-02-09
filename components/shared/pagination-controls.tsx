"use client"

import type React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PaginationControlsProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  showPageSize?: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  showPageSize = true,
}: PaginationControlsProps) {
  const options = pageSizeOptions?.length ? pageSizeOptions : [10, 20, 30, 50]
  const canChangeSize = showPageSize && typeof onPageSizeChange === "function"
  const showPagination = totalPages > 1
  if (!showPagination && !canChangeSize) return null

  const goToPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages)
    onPageChange(next)
  }

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, page: number) => {
    event.preventDefault()
    goToPage(page)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {showPagination ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => handleClick(event, currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(event) => handleClick(event, page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => handleClick(event, currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : (
        <span className="text-xs text-muted-foreground">All results shown</span>
      )}
      {canChangeSize ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows</span>
          <Select
            value={String(pageSize ?? options[0])}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-8 w-[88px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )
}
