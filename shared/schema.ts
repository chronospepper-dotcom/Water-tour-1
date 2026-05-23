import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schedule state types
export type ScheduleState = 
  | "OUVERT" 
  | "FERME" 
  | "FERMETURE_6H" 
  | "OUVERTURE_17H" 
  | "OUVERTURE_7H_FERMETURE_17H"
  | "OUVERTURE_6H"
  | "FERMETURE_17H";

// Days of the week
export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;
export type Day = typeof DAYS[number];

// Sectors
export const SECTORS = ["01", "02", "03", "04"] as const;
export type Sector = typeof SECTORS[number];

// Schedule entry - one per day per sector
export interface ScheduleEntry {
  date: string; // ISO date string YYYY-MM-DD
  sector: Sector;
  state: ScheduleState;
}

// Weekly schedule data structure
export interface WeeklySchedule {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  description: string; // General schedule description
  entries: ScheduleEntry[];
}

// Village assigned to a sector
export interface Village {
  name: string;
  sector: Sector;
}

// Village breakdown by sector
export interface VillageBreakdown {
  id: string;
  villages: Village[];
}

// Alert banner configuration
export interface AlertConfig {
  id: string;
  isActive: boolean;
  message: string;
  severity: "warning" | "danger";
}

// Site info - all editable text content
export interface SiteInfo {
  id: string;
  siteTitle: string;
  noticeTitle: string;
  noticeText: string;
  footerText: string;
  sourcesTitle: string;
  sourcesDescription: string;
  qrPromptText: string;
  whatsappMessage: string;
}

// Email configuration (never exposed publicly)
export interface EmailConfig {
  gmailUser: string;
  gmailAppPassword: string;
  backupEmail: string;
}

export const emailConfigSchema = z.object({
  gmailUser: z.string(),
  gmailAppPassword: z.string(),
  backupEmail: z.string(),
});

// Site configuration
export interface SiteConfig {
  schedule: WeeklySchedule;
  villages: VillageBreakdown;
  alert: AlertConfig;
  siteInfo: SiteInfo;
}

// Zod schemas for validation
export const scheduleStateSchema = z.enum([
  "OUVERT",
  "FERME",
  "FERMETURE_6H",
  "OUVERTURE_17H",
  "OUVERTURE_7H_FERMETURE_17H",
  "OUVERTURE_6H",
  "FERMETURE_17H"
]);

export const daySchema = z.enum(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]);

export const sectorSchema = z.enum(["01", "02", "03", "04"]);

export const scheduleEntrySchema = z.object({
  date: z.string(),
  sector: sectorSchema,
  state: scheduleStateSchema,
});

export const weeklyScheduleSchema = z.object({
  id: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  entries: z.array(scheduleEntrySchema),
});

export const villageSchema = z.object({
  name: z.string().min(1),
  sector: sectorSchema,
});

export const villageBreakdownSchema = z.object({
  id: z.string(),
  villages: z.array(villageSchema),
});

export const alertConfigSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
  message: z.string(),
  severity: z.enum(["warning", "danger"]),
});

export const siteInfoSchema = z.object({
  id: z.string(),
  siteTitle: z.string().min(1),
  noticeTitle: z.string(),
  noticeText: z.string(),
  footerText: z.string(),
  sourcesTitle: z.string(),
  sourcesDescription: z.string(),
  qrPromptText: z.string(),
  whatsappMessage: z.string(),
});

export const siteConfigSchema = z.object({
  schedule: weeklyScheduleSchema,
  villages: villageBreakdownSchema,
  alert: alertConfigSchema,
  siteInfo: siteInfoSchema,
});

// Insert schemas for updates
export const updateScheduleSchema = weeklyScheduleSchema.omit({ id: true });
export const updateVillagesSchema = villageBreakdownSchema.omit({ id: true });
export const updateAlertSchema = alertConfigSchema.omit({ id: true });
export const updateSiteInfoSchema = siteInfoSchema.omit({ id: true });

export type UpdateSchedule = z.infer<typeof updateScheduleSchema>;
export type UpdateVillages = z.infer<typeof updateVillagesSchema>;
export type UpdateAlert = z.infer<typeof updateAlertSchema>;
export type UpdateSiteInfo = z.infer<typeof updateSiteInfoSchema>;
export type UpdateEmailConfig = z.infer<typeof emailConfigSchema>;
