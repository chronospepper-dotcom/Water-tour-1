import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { storage } from "./storage";
import { parsePdfBuffer } from "./pdfParser";
import { sendBackupEmail } from "./emailService";
import { 
  updateScheduleSchema, 
  updateVillagesSchema, 
  updateAlertSchema,
  updateSiteInfoSchema,
  emailConfigSchema,
} from "@shared/schema";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const PROJECT_ROOT = path.resolve(process.cwd());
const EXCLUDED = new Set(["node_modules", ".git", ".local", "dist", ".replit", ".cache", "attached_assets"]);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get complete site configuration (public)
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // Get schedule (public)
  app.get("/api/schedule", async (req, res) => {
    try {
      const schedule = await storage.getSchedule();
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  // Update schedule (protected)
  app.put("/api/schedule", requireAuth, async (req, res) => {
    try {
      const parsed = updateScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const schedule = await storage.updateSchedule(parsed.data);
      res.json(schedule);
      Promise.all([storage.getSiteConfig(), storage.getEmailConfig()])
        .then(([config, emailCfg]) => sendBackupEmail(config, emailCfg, "Planning mis à jour"))
        .catch(() => {});
    } catch (error) {
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  // Get villages (public)
  app.get("/api/villages", async (req, res) => {
    try {
      const villages = await storage.getVillages();
      res.json(villages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch villages" });
    }
  });

  // Update villages (protected)
  app.put("/api/villages", requireAuth, async (req, res) => {
    try {
      const parsed = updateVillagesSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const villages = await storage.updateVillages(parsed.data);
      res.json(villages);
      Promise.all([storage.getSiteConfig(), storage.getEmailConfig()])
        .then(([config, emailCfg]) => sendBackupEmail(config, emailCfg, "Villages mis à jour"))
        .catch(() => {});
    } catch (error) {
      res.status(500).json({ error: "Failed to update villages" });
    }
  });

  // Get alert (public)
  app.get("/api/alert", async (req, res) => {
    try {
      const alert = await storage.getAlert();
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  // Update alert (protected)
  app.put("/api/alert", requireAuth, async (req, res) => {
    try {
      const parsed = updateAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const alert = await storage.updateAlert(parsed.data);
      res.json(alert);
      Promise.all([storage.getSiteConfig(), storage.getEmailConfig()])
        .then(([config, emailCfg]) => sendBackupEmail(config, emailCfg, "Alerte mise à jour"))
        .catch(() => {});
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Get site info (public)
  app.get("/api/site-info", async (req, res) => {
    try {
      const info = await storage.getSiteInfo();
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch site info" });
    }
  });

  // Update site info (protected)
  app.put("/api/site-info", requireAuth, async (req, res) => {
    try {
      const parsed = updateSiteInfoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const info = await storage.updateSiteInfo(parsed.data);
      res.json(info);
      Promise.all([storage.getSiteConfig(), storage.getEmailConfig()])
        .then(([config, emailCfg]) => sendBackupEmail(config, emailCfg, "Textes du site mis à jour"))
        .catch(() => {});
    } catch (error) {
      res.status(500).json({ error: "Failed to update site info" });
    }
  });

  // Get email config (protected) — password is masked
  app.get("/api/admin/email-config", requireAuth, async (req, res) => {
    try {
      const cfg = await storage.getEmailConfig();
      res.json({
        gmailUser: cfg.gmailUser,
        gmailAppPassword: cfg.gmailAppPassword ? "••••••••" : "",
        backupEmail: cfg.backupEmail,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email config" });
    }
  });

  // Update email config (protected)
  app.put("/api/admin/email-config", requireAuth, async (req, res) => {
    try {
      const parsed = emailConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const cfg = await storage.updateEmailConfig(parsed.data);
      res.json({
        gmailUser: cfg.gmailUser,
        gmailAppPassword: cfg.gmailAppPassword ? "••••••••" : "",
        backupEmail: cfg.backupEmail,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update email config" });
    }
  });

  // Test email (protected)
  app.post("/api/admin/test-email", requireAuth, async (req, res) => {
    try {
      const [config, emailCfg] = await Promise.all([storage.getSiteConfig(), storage.getEmailConfig()]);
      const ok = await sendBackupEmail(config, emailCfg, "Test de connexion email");
      if (ok) {
        res.json({ success: true, message: `Email de test envoyé à ${emailCfg.backupEmail}` });
      } else {
        res.status(400).json({ success: false, message: "Échec d'envoi. Vérifiez les identifiants Gmail et l'adresse de destination." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du test" });
    }
  });

  // PDF upload and parse (protected)
  app.post("/api/admin/parse-pdf", requireAuth, upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }
      const result = await parsePdfBuffer(req.file.buffer);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du traitement du PDF" });
    }
  });

  // Download site as zip (protected)
  app.get("/api/admin/download-site", requireAuth, async (req, res) => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="tours-eau-mayotte-${date}.zip"`);

      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.pipe(res);
      archive.on("error", (err) => {
        console.error("[download] Archive error:", err);
      });

      function addDir(dirPath: string, zipPath: string) {
        if (!fs.existsSync(dirPath)) return;
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          if (EXCLUDED.has(item)) continue;
          const full = path.join(dirPath, item);
          const zip = path.join(zipPath, item);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            addDir(full, zip);
          } else {
            archive.file(full, { name: zip });
          }
        }
      }

      addDir(path.join(PROJECT_ROOT, "client"), "client");
      addDir(path.join(PROJECT_ROOT, "server"), "server");
      addDir(path.join(PROJECT_ROOT, "shared"), "shared");

      const rootFiles = ["package.json", "package-lock.json", "vite.config.ts", "tailwind.config.ts", 
        "tsconfig.json", "drizzle.config.ts", "replit.md", "postcss.config.js"];
      for (const f of rootFiles) {
        const fp = path.join(PROJECT_ROOT, f);
        if (fs.existsSync(fp)) archive.file(fp, { name: f });
      }

      await archive.finalize();
    } catch (error) {
      console.error("[download] Error:", error);
      if (!res.headersSent) res.status(500).json({ error: "Erreur lors de la création du ZIP" });
    }
  });

  // Download current config data as JSON (protected)
  app.get("/api/admin/download-config", requireAuth, async (req, res) => {
    try {
      const config = await storage.getSiteConfig();
      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="config-${date}.json"`);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'export" });
    }
  });

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      const hashedPassword = hashPassword(password);
      
      if (!user || user.password !== hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.isAdmin = true;
      req.session.userId = user.id;
      
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Check auth status
  app.get("/api/admin/status", (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAdmin });
  });

  // Logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  return httpServer;
}
