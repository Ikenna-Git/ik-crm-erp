import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role?: string
      orgId?: string
      twoFactorEnabled?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: string
    orgId?: string
    twoFactorEnabled?: boolean
  }
}
