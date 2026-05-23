import { 
  type User, 
  type InsertUser, 
  type SiteConfig,
  type WeeklySchedule,
  type VillageBreakdown,
  type AlertConfig,
  type SiteInfo,
  type EmailConfig,
  type UpdateSchedule,
  type UpdateVillages,
  type UpdateAlert,
  type UpdateSiteInfo,
  type UpdateEmailConfig,
  DAYS,
  SECTORS
} from "@shared/schema";
import { randomUUID, createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Site configuration
  getSiteConfig(): Promise<SiteConfig>;
  getSchedule(): Promise<WeeklySchedule>;
  updateSchedule(schedule: UpdateSchedule): Promise<WeeklySchedule>;
  getVillages(): Promise<VillageBreakdown>;
  updateVillages(villages: UpdateVillages): Promise<VillageBreakdown>;
  getAlert(): Promise<AlertConfig>;
  updateAlert(alert: UpdateAlert): Promise<AlertConfig>;
  getSiteInfo(): Promise<SiteInfo>;
  updateSiteInfo(info: UpdateSiteInfo): Promise<SiteInfo>;
  getEmailConfig(): Promise<EmailConfig>;
  updateEmailConfig(config: UpdateEmailConfig): Promise<EmailConfig>;
}

// Default data - empty schedule, admin will fill it
const defaultSchedule: WeeklySchedule = {
  id: "schedule-1",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 31 * 86400000).toISOString().split("T")[0],
  description: "Distribution d'eau selon les secteurs. Les horaires peuvent varier selon les conditions.",
  entries: []
};

const defaultVillages: VillageBreakdown = {
  id: "villages-1",
  villages: [
    // Secteur 01
    { name: "Acoua (sauf Marvatou)", sector: "01" },
    { name: "Bambo-Est", sector: "01" },
    { name: "Bambo-Ouest", sector: "01" },
    { name: "Bandraboua village (nord)", sector: "01" },
    { name: "Barakani", sector: "01" },
    { name: "Bouyouni", sector: "01" },
    { name: "Coconi", sector: "01" },
    { name: "Combani Sud", sector: "01" },
    { name: "Convaslescence - Mdz (100 villas, vertivert)", sector: "01" },
    { name: "Dembeni village", sector: "01" },
    { name: "Doujani", sector: "01" },
    { name: "Hagnoundrou", sector: "01" },
    { name: "Handrema", sector: "01" },
    { name: "Hapandzo", sector: "01" },
    { name: "Hauts Vallons", sector: "01" },
    { name: "Iloni", sector: "01" },
    { name: "Kani-Kéli village", sector: "01" },
    { name: "Labattoir - Centre", sector: "01" },
    { name: "Majicavo-Lamir", sector: "01" },
    { name: "Mamoudzou Centre", sector: "01" },
    { name: "Mbouenatsa", sector: "01" },
    { name: "Mramadoudou", sector: "01" },
    { name: "Mtsahara", sector: "01" },
    { name: "Mtsamoudou Bas", sector: "01" },
    { name: "Mtsapéré Bonovo", sector: "01" },
    { name: "Nyambadao", sector: "01" },
    { name: "Pamandzi Est", sector: "01" },
    { name: "Pamandzi La Vigie", sector: "01" },
    { name: "Passamainty Manguiers", sector: "01" },
    { name: "Poroani", sector: "01" },
    { name: "Sohoa", sector: "01" },
    { name: "Trévani", sector: "01" },
    { name: "Tsingoni", sector: "01" },
    // Secteur 02
    { name: "Acoua (Marvatou)", sector: "02" },
    { name: "Bandraboua village (sud - Ngambo Titi)", sector: "02" },
    { name: "Bandrélé village", sector: "02" },
    { name: "Chembenyoumba", sector: "02" },
    { name: "Chiconi village", sector: "02" },
    { name: "Chirongui village", sector: "02" },
    { name: "Convalescence - Cavani Sud", sector: "02" },
    { name: "Dapani", sector: "02" },
    { name: "Ironi-Bé", sector: "02" },
    { name: "Kani-Bé", sector: "02" },
    { name: "Kawéni village", sector: "02" },
    { name: "Koungou village", sector: "02" },
    { name: "Labattoir - Badamiers", sector: "02" },
    { name: "Longoni", sector: "02" },
    { name: "Mamoudzou - Boboka et Marché Couvert", sector: "02" },
    { name: "Mbouini", sector: "02" },
    { name: "Miréréni (Chirongui)", sector: "02" },
    { name: "Miréréni (Tsingoni)", sector: "02" },
    { name: "Moinatrindri Bas", sector: "02" },
    { name: "Mtsamboro village", sector: "02" },
    { name: "Mtsangadoua", sector: "02" },
    { name: "Musicale Plage", sector: "02" },
    { name: "Mzouazia", sector: "02" },
    { name: "Ouangani village", sector: "02" },
    { name: "Passamainty Kavani-Bé + Ngambo Titi", sector: "02" },
    { name: "Tsararano", sector: "02" },
    { name: "Tsoundzou I", sector: "02" },
    // Secteur 03
    { name: "Bouéni", sector: "03" },
    { name: "Cavani-Mamoudzou", sector: "03" },
    { name: "Choungui", sector: "03" },
    { name: "Combani Nord", sector: "03" },
    { name: "Dzaoudzi - Blv des Crabes", sector: "03" },
    { name: "Dzoumogné", sector: "03" },
    { name: "Hajangoua", sector: "03" },
    { name: "Hamjago", sector: "03" },
    { name: "Hamouro", sector: "03" },
    { name: "Kahani", sector: "03" },
    { name: "Kangani", sector: "03" },
    { name: "Kwalé", sector: "03" },
    { name: "Labattoir La Vigie", sector: "03" },
    { name: "Majicavo-Koropa", sector: "03" },
    { name: "Malamani", sector: "03" },
    { name: "Mangajou", sector: "03" },
    { name: "Mgnambani", sector: "03" },
    { name: "Mliha", sector: "03" },
    { name: "Moinatrindri Haut", sector: "03" },
    { name: "Mroalé", sector: "03" },
    { name: "Mronabéja", sector: "03" },
    { name: "Mtsamoudou Haut", sector: "03" },
    { name: "Mtsangamboua", sector: "03" },
    { name: "Mtsangamouji village", sector: "03" },
    { name: "Mtsapéré", sector: "03" },
    { name: "Ongoujou", sector: "03" },
    { name: "Pamandzi Ouest", sector: "03" },
    { name: "Passi-Kéli", sector: "03" },
    { name: "Sada", sector: "03" },
    { name: "Tsimkoura", sector: "03" },
    { name: "Tsoundzou II", sector: "03" },
    { name: "Vahibé", sector: "03" },
    // Secteur 04
    { name: "Z.I. Kawéni", sector: "04" },
  ]
};

const defaultAlert: AlertConfig = {
  id: "alert-1",
  isActive: false,
  message: "",
  severity: "warning"
};

const defaultSiteInfo: SiteInfo = {
  id: "site-info-1",
  siteTitle: "Tours d'Eau Mayotte",
  noticeTitle: "Important",
  noticeText: "Les informations affichées proviennent de sources publiques et peuvent changer. Les utilisateurs sont fortement encouragés à vérifier et à recouper les informations eux-mêmes.",
  footerText: "Ce site est un outil d'information communautaire. Il n'est pas affilié à une institution officielle.",
  sourcesTitle: "Vérification des sources",
  sourcesDescription: "Ce bouton donne accès aux sources utilisées pour la vérification des informations sur la distribution d'eau à Mayotte.",
  qrPromptText: "Recherchez les horaires actuels de distribution d'eau à Mayotte et fournissez les sources telles que :\n- Préfecture de Mayotte\n- Mahoraise des Eaux (SMAE)\n- Journal de Mayotte\n- Mayotte Hebdo",
  whatsappMessage: "Consultez les horaires des tours d'eau à Mayotte ici : ",
};

const defaultEmailConfig: EmailConfig = {
  gmailUser: "",
  gmailAppPassword: "",
  backupEmail: "",
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private schedule: WeeklySchedule;
  private villages: VillageBreakdown;
  private alert: AlertConfig;
  private siteInfo: SiteInfo;
  private emailConfig: EmailConfig;

  constructor() {
    this.users = new Map();
    this.schedule = { ...defaultSchedule };
    this.villages = { ...defaultVillages };
    this.alert = { ...defaultAlert };
    this.siteInfo = { ...defaultSiteInfo };
    this.emailConfig = { ...defaultEmailConfig };
    
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminPassword) {
      console.log(`[storage] Creating admin user: ${adminUsername}`);
      this.createUserWithHashedPassword({ username: adminUsername, password: hashPassword(adminPassword) });
    } else {
      console.warn("[storage] ADMIN_PASSWORD secret is not set! Admin login will not work.");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedUser = { ...insertUser, password: hashPassword(insertUser.password) };
    const user: User = { ...hashedUser, id };
    this.users.set(id, user);
    return user;
  }

  createUserWithHashedPassword(userData: { username: string; password: string }): User {
    const id = randomUUID();
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async getSiteConfig(): Promise<SiteConfig> {
    return {
      schedule: this.schedule,
      villages: this.villages,
      alert: this.alert,
      siteInfo: this.siteInfo,
    };
  }

  async getSchedule(): Promise<WeeklySchedule> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    this.schedule.entries = this.schedule.entries.filter(e => new Date(e.date) >= now);
    return this.schedule;
  }

  async updateSchedule(schedule: UpdateSchedule): Promise<WeeklySchedule> {
    this.schedule = { ...this.schedule, ...schedule };
    return this.schedule;
  }

  async getVillages(): Promise<VillageBreakdown> {
    return this.villages;
  }

  async updateVillages(villages: UpdateVillages): Promise<VillageBreakdown> {
    this.villages = { ...this.villages, ...villages };
    return this.villages;
  }

  async getAlert(): Promise<AlertConfig> {
    return this.alert;
  }

  async updateAlert(alert: UpdateAlert): Promise<AlertConfig> {
    this.alert = { ...this.alert, ...alert };
    return this.alert;
  }

  async getSiteInfo(): Promise<SiteInfo> {
    return this.siteInfo;
  }

  async updateSiteInfo(info: UpdateSiteInfo): Promise<SiteInfo> {
    this.siteInfo = { ...this.siteInfo, ...info };
    return this.siteInfo;
  }

  async getEmailConfig(): Promise<EmailConfig> {
    return this.emailConfig;
  }

  async updateEmailConfig(config: UpdateEmailConfig): Promise<EmailConfig> {
    // If password is the masked placeholder, keep existing password
    const password = config.gmailAppPassword === "••••••••" 
      ? this.emailConfig.gmailAppPassword 
      : config.gmailAppPassword;
    this.emailConfig = { ...this.emailConfig, ...config, gmailAppPassword: password };
    return this.emailConfig;
  }
}

export const storage = new MemStorage();
