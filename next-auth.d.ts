import "next-auth"
import type { AccessProfile, ModuleAccessInput } from "@/lib/access-control"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: string
      orgId?: string
      accessProfile?: AccessProfile
      moduleAccess?: ModuleAccessInput
      twoFactorEnabled?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: string
    orgId?: string
    accessProfile?: AccessProfile
    moduleAccess?: ModuleAccessInput
    twoFactorEnabled?: boolean
  }
}
