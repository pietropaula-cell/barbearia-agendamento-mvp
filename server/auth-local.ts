import crypto from "crypto";

/**
 * Hash uma senha usando PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica se uma senha corresponde ao hash armazenado
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return computedHash === storedHash;
}

/**
 * Gera uma senha aleatória
 */
export function generateRandomPassword(length: number = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
