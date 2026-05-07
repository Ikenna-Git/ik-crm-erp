import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WorkspaceRequiredPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl">Workspace setup required</CardTitle>
            <CardDescription className="text-base">
              Your account is authenticated, but it is not attached to an active Civis workspace yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <p>
              This is a safe holding screen. Civis will not auto-create a demo workspace or silently attach you to a
              default organization in production.
            </p>
            <p>
              If you were invited, ask the workspace owner to resend the invite or confirm that your account has been
              attached to the correct organization. If you are the platform owner, create the workspace first from the
              admin control plane.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/admin/system">Go to workspace admin</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
