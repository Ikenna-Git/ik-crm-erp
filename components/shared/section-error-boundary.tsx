"use client"

import React from "react"

type Props = {
  title: string
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error(`Section failed to render: ${this.props.title}`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-medium">{this.props.title} is temporarily unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This section hit a client-side error. The rest of the accounting workspace should stay available.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
