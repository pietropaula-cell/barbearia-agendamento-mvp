import { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { sendReminderMessage } from "./whatsapp-service";

/**
 * Handler para enviar lembretes de WhatsApp 1 hora antes do agendamento
 * Executado via Heartbeat (cron job)
 */
export async function handleWhatsappReminder(req: Request, res: Response) {
  try {
    // Autenticar como cron
    const user = await sdk.authenticateRequest(req);

    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Buscar agendamentos que devem receber lembrete
    const db = getDb();
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Query para encontrar agendamentos na próxima hora que ainda não receberam lembrete
    const query = `
      SELECT 
        a.id, a.barbershopId, a.barberId, a.serviceId, 
        c.name as customerName, c.phone as customerPhone,
        a.startsAt, a.reminderSentAt
      FROM appointments a
      JOIN customers c ON a.customerId = c.id
      WHERE a.status = 'pending'
        AND a.startsAt > ?
        AND a.startsAt <= ?
        AND (a.reminderSentAt IS NULL OR a.reminderSentAt = '')
      LIMIT 100
    `;

    const appointments = await (db as any).execute(query, [now.toISOString(), oneHourLater.toISOString()]);

    let sentCount = 0;
    let errorCount = 0;

    for (const appt of appointments) {
      try {
        const result = await sendReminderMessage(
          appt.id,
          appt.barbershopId,
          appt.barberId,
          appt.serviceId,
          appt.customerName,
          appt.customerPhone,
          new Date(appt.startsAt)
        );

        if (result.success) {
          // Marcar como enviado
          await (db as any).execute(
            `UPDATE appointments SET reminderSentAt = ? WHERE id = ?`,
            [new Date().toISOString(), appt.id]
          );
          sentCount++;
          console.log(`[Reminder] Lembrete enviado para agendamento ${appt.id}`);
        } else {
          console.error(`[Reminder] Erro ao enviar para agendamento ${appt.id}:`, result.error);
          errorCount++;
        }
      } catch (err) {
        console.error(`[Reminder] Erro ao processar agendamento ${appt.id}:`, err);
        errorCount++;
      }
    }

    res.json({ ok: true, sentCount, errorCount, totalProcessed: appointments.length });
  } catch (error) {
    console.error("[Reminder] Erro no handler:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url, timestamp: new Date().toISOString() },
    });
  }
}
