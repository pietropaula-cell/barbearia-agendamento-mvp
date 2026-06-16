import crypto from "crypto";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function generateRandomPassword(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
    });

    const adminEmail = "admin@barbearia.com";
    const password = generateRandomPassword(16);
    const passwordHash = hashPassword(password);

    // Verificar se admin já existe
    const [existingAdmin] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [adminEmail]
    );

    if (existingAdmin.length > 0) {
      console.log("ℹ️  Admin já existe. Atualizando senha...");
      await connection.execute(
        "UPDATE users SET passwordHash = ? WHERE email = ?",
        [passwordHash, adminEmail]
      );
    } else {
      console.log("✨ Criando novo admin...");
      await connection.execute(
        "INSERT INTO users (name, email, passwordHash, role, loginMethod) VALUES (?, ?, ?, ?, ?)",
        ["Administrador", adminEmail, passwordHash, "admin", "local"]
      );
    }

    await connection.end();

    console.log("\n✅ Admin criado/atualizado com sucesso!\n");
    console.log("📧 Email: " + adminEmail);
    console.log("🔐 Senha: " + password);
    console.log("\n⚠️  Guarde essa senha em um local seguro!\n");
  } catch (error) {
    console.error("❌ Erro ao criar admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
