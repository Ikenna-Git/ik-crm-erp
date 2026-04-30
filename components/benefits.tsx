"use client"

const benefits = [
  {
    title: "One place to operate",
    description: "Your sales, finance, people, projects, and client updates stop living in disconnected dashboards.",
  },
  {
    title: "Cleaner admin boundaries",
    description: "Founders, company admins, and teammates each get the level of control they actually need.",
  },
  {
    title: "Plain-language workflows",
    description: "Users should understand what to do next from the page they are on, not after a training session.",
  },
  {
    title: "Ready to grow into a platform",
    description: "Civis is being shaped to feel operational like Hubstaff and broad like Odoo without becoming bloated.",
  },
]

export function Benefits() {
  return (
    <section className="bg-muted/35 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">What we are optimizing for</p>
          <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">A product normal teams can understand fast.</h2>
          <p className="text-base leading-7 text-muted-foreground">
            The right next step for Civis is not more noise. It is sharper structure, clearer pages, better admin control,
            and a product story that feels credible to operators, founders, and stakeholders.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-[28px] border border-border/80 bg-card p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-foreground">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
