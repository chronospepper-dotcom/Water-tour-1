import nodemailer from "nodemailer";
import type { SiteConfig, EmailConfig } from "@shared/schema";

function formatConfigAsText(config: SiteConfig, emailCfg: EmailConfig): string {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Indian/Mayotte" });
  const lines: string[] = [
    `=== SAUVEGARDE AUTOMATIQUE — ${config.siteInfo.siteTitle} ===`,
    `Date : ${now}`,
    "",
    "--- ALERTE ---",
    `Active : ${config.alert.isActive ? "OUI" : "NON"}`,
    `Gravité : ${config.alert.severity}`,
    `Message : ${config.alert.message || "(aucun)"}`,
    "",
    "--- PLANNING ---",
    `Description : ${config.schedule.description}`,
    `Entrées : ${config.schedule.entries.length}`,
  ];

  if (config.schedule.entries.length > 0) {
    lines.push("");
    const sorted = [...config.schedule.entries].sort((a, b) => a.date.localeCompare(b.date));
    const byDate: Record<string, typeof sorted> = {};
    for (const e of sorted) {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    }
    for (const [date, entries] of Object.entries(byDate)) {
      const row = entries.map(e => `Secteur ${e.sector}: ${e.state}`).join(" | ");
      lines.push(`  ${date} — ${row}`);
    }
  }

  lines.push("", "--- VILLAGES ---", `Total : ${config.villages.villages.length} villages`);
  for (const sector of ["01", "02", "03", "04"] as const) {
    const v = config.villages.villages.filter(v => v.sector === sector);
    lines.push(`  Secteur ${sector} (${v.length}) : ${v.map(v => v.name).join(", ")}`);
  }

  lines.push("", "--- CONFIG JSON ---");
  lines.push(JSON.stringify(config, null, 2));

  return lines.join("\n");
}

export async function sendBackupEmail(
  config: SiteConfig,
  emailCfg: EmailConfig,
  changeType: string
): Promise<boolean> {
  const toEmail = emailCfg.backupEmail?.trim();
  const fromUser = emailCfg.gmailUser?.trim();
  const fromPass = emailCfg.gmailAppPassword?.trim();

  if (!toEmail || !fromUser || !fromPass) {
    if (toEmail) {
      console.warn("[email] Configuration email incomplète — sauvegarde ignorée.");
    }
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromUser, pass: fromPass },
  });

  const now = new Date().toLocaleString("fr-FR", { timeZone: "Indian/Mayotte" });
  const subject = `[${config.siteInfo.siteTitle}] Sauvegarde — ${changeType} — ${now}`;

  try {
    await transporter.sendMail({
      from: `"${config.siteInfo.siteTitle}" <${fromUser}>`,
      to: toEmail,
      subject,
      text: formatConfigAsText(config, emailCfg),
      attachments: [
        {
          filename: `sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
          content: JSON.stringify(config, null, 2),
          contentType: "application/json",
        },
      ],
    });
    console.log(`[email] Sauvegarde envoyée à ${toEmail}`);
    return true;
  } catch (err) {
    console.error("[email] Erreur d'envoi:", err);
    return false;
  }
}
