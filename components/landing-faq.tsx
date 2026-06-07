"use client"

const faqs = [
  {
    question: "Is public self-serve billing live?",
    answer:
      "Not yet. Pricing is live to review, but self-serve checkout and billing validation are still treated as launch blockers until the live evidence is complete.",
  },
  {
    question: "Can a workspace admin see platform-wide data?",
    answer:
      "No. Founder-only controls and platform-wide APIs stay separate from normal workspace admin access, and org-scoped admin routes only show the current workspace.",
  },
  {
    question: "How does Civis handle sensitive HR and Accounting data?",
    answer:
      "Role-based access is the real security layer. On top of that, HR and Accounting use separate privacy PIN unlocks so sensitive rows, details, and exports stay hidden until an authorized manager unlocks them for the session.",
  },
  {
    question: "What happens if a provider is not configured?",
    answer:
      "Civis fails clearly. Uploads, AI drafting, email, billing, and similar provider-backed paths should show setup-required states instead of fake success.",
  },
]

export function LandingFaq() {
  return (
    <section className="bg-muted/35 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Beautiful, clear, and honest answers.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Civis should set expectations properly before anyone creates a workspace or starts a demo.
          </p>
        </div>

        <div className="mt-12 grid gap-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-[28px] border border-border/80 bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
