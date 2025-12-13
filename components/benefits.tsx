"use client"

export function Benefits() {
  return (
    <section className="py-20 lg:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <h3 className="text-3xl lg:text-4xl font-bold text-primary">90%</h3>
            <p className="text-muted-foreground">Reduction in manual data entry</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl lg:text-4xl font-bold text-primary">3x</h3>
            <p className="text-muted-foreground">Faster decision making with real-time insights</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl lg:text-4xl font-bold text-primary">50+</h3>
            <p className="text-muted-foreground">Integrations with popular business tools</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl lg:text-4xl font-bold text-primary">99.9%</h3>
            <p className="text-muted-foreground">Uptime SLA with enterprise support</p>
          </div>
        </div>
      </div>
    </section>
  )
}
