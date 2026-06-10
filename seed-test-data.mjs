import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool(process.env.DATABASE_URL);

async function seedTestData() {
  const connection = await pool.getConnection();

  try {
    console.log("🌱 Iniciando seed de dados de teste...\n");

    // 1. Criar barbearia de teste
    console.log("📍 Criando barbearia de teste...");
    const [barbershopResult] = await connection.execute(
      `INSERT INTO barbershops (name, slug, phone, address, description, accentColor, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Barbearia Premium",
        "barbearia-premium",
        "(11) 98765-4321",
        "Rua das Flores, 123 - São Paulo, SP",
        "A melhor barbearia da região com profissionais experientes",
        "#C9A84C",
        true,
      ]
    );
    const barbershopId = barbershopResult.insertId;
    console.log(`✅ Barbearia criada: ID ${barbershopId}\n`);

    // 2. Criar usuário owner de teste
    console.log("👤 Criando usuário owner de teste...");
    const [userResult] = await connection.execute(
      `INSERT INTO users (openId, name, email, loginMethod, role, barbershopId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "test-owner-" + Date.now(),
        "João Silva",
        "joao@barbearia.com",
        "test",
        "owner",
        barbershopId,
      ]
    );
    const ownerId = userResult.insertId;
    console.log(`✅ Usuário owner criado: ID ${ownerId}\n`);

    // 3. Criar barbeiros
    console.log("✂️  Criando barbeiros...");
    const barbers = [
      { name: "Carlos", specialty: "Corte Clássico" },
      { name: "Roberto", specialty: "Barba e Corte" },
      { name: "Felipe", specialty: "Design de Sobrancelha" },
    ];

    const barberIds = [];
    for (const barber of barbers) {
      const [result] = await connection.execute(
        `INSERT INTO barbers (barbershopId, name, specialty, active) 
         VALUES (?, ?, ?, ?)`,
        [barbershopId, barber.name, barber.specialty, true]
      );
      barberIds.push(result.insertId);
      console.log(`  ✅ Barbeiro ${barber.name} criado`);
    }
    console.log();

    // 4. Criar serviços
    console.log("💇 Criando serviços...");
    const services = [
      { name: "Corte Clássico", duration: 30, price: 50.0 },
      { name: "Corte + Barba", duration: 45, price: 80.0 },
      { name: "Barba", duration: 20, price: 40.0 },
      { name: "Hidratação", duration: 40, price: 60.0 },
    ];

    const serviceIds = [];
    for (const service of services) {
      const [result] = await connection.execute(
        `INSERT INTO services (barbershopId, name, duration, price, active) 
         VALUES (?, ?, ?, ?, ?)`,
        [barbershopId, service.name, service.duration, service.price, true]
      );
      serviceIds.push(result.insertId);
      console.log(`  ✅ Serviço ${service.name} criado`);
    }
    console.log();

    // 5. Criar horários de trabalho (segunda a sexta, 9h às 18h)
    console.log("⏰ Criando horários de trabalho...");
    const daysOfWeek = [1, 2, 3, 4, 5]; // Seg-Sex
    const hours = [9, 10, 11, 12, 14, 15, 16, 17]; // 9h-18h com intervalo 12-14h

    for (const barberId of barberIds) {
      for (const day of daysOfWeek) {
        for (const hour of hours) {
          const timeStr = `${String(hour).padStart(2, "0")}:00`;
          await connection.execute(
            `INSERT INTO barber_schedules (barberId, dayOfWeek, startTime, endTime, isAvailable) 
             VALUES (?, ?, ?, ?, ?)`,
            [barberId, day, timeStr, `${String(hour + 1).padStart(2, "0")}:00`, true]
          );
        }
      }
      console.log(`  ✅ Horários criados para barbeiro ID ${barberId}`);
    }
    console.log();

    // 6. Criar clientes de teste
    console.log("👥 Criando clientes de teste...");
    const customers = [
      { name: "Pedro Silva", phone: "11987654321" },
      { name: "Ana Costa", phone: "11987654322" },
      { name: "Bruno Santos", phone: "11987654323" },
    ];

    const customerIds = [];
    for (const customer of customers) {
      const [result] = await connection.execute(
        `INSERT INTO customers (barbershopId, name, phone) 
         VALUES (?, ?, ?)`,
        [barbershopId, customer.name, customer.phone]
      );
      customerIds.push(result.insertId);
      console.log(`  ✅ Cliente ${customer.name} criado`);
    }
    console.log();

    // 7. Criar agendamentos de teste
    console.log("📅 Criando agendamentos de teste...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const appointments = [
      { barberId: barberIds[0], serviceId: serviceIds[0], customerId: customerIds[0], time: "09:00", status: "confirmed" },
      { barberId: barberIds[1], serviceId: serviceIds[1], customerId: customerIds[1], time: "10:00", status: "pending" },
      { barberId: barberIds[2], serviceId: serviceIds[2], customerId: customerIds[2], time: "14:00", status: "confirmed" },
    ];

    for (const apt of appointments) {
      await connection.execute(
        `INSERT INTO appointments (barberId, serviceId, customerId, appointmentDate, appointmentTime, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [apt.barberId, apt.serviceId, apt.customerId, dateStr, apt.time, apt.status]
      );
      console.log(`  ✅ Agendamento criado: ${dateStr} ${apt.time}`);
    }
    console.log();

    console.log("✨ Seed de dados concluído com sucesso!\n");
    console.log("📋 Dados criados:");
    console.log(`  - Barbearia: Barbearia Premium (ID: ${barbershopId})`);
    console.log(`  - Owner: João Silva (ID: ${ownerId})`);
    console.log(`  - Barbeiros: ${barberIds.length}`);
    console.log(`  - Serviços: ${serviceIds.length}`);
    console.log(`  - Clientes: ${customerIds.length}`);
    console.log(`  - Agendamentos: ${appointments.length}`);
    console.log("\n🔗 Link de agendamento público:");
    console.log(`  https://seu-dominio.com/agendar/barbearia-premium\n`);
    console.log("👤 Credenciais de teste:");
    console.log(`  Email: joao@barbearia.com`);
    console.log(`  Role: owner`);
    console.log(`  Barbearia: Barbearia Premium\n`);

  } catch (error) {
    console.error("❌ Erro ao fazer seed:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedTestData().catch(console.error);
