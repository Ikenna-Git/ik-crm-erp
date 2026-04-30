import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const PASSWORD_KEY_LENGTH = 64

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex")
  return `${salt}:${hash}`
}

export const verifyPassword = (password: string, storedHash?: string | null) => {
  if (!storedHash) return false

  const [salt, expectedHash] = storedHash.split(":")
  if (!salt || !expectedHash) return false

  const actualHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH)
  const expectedBuffer = Buffer.from(expectedHash, "hex")

  return expectedBuffer.length === actualHash.length && timingSafeEqual(expectedBuffer, actualHash)
}
