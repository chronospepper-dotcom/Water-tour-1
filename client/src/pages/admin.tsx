import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, LogIn, Upload, FileText, CheckCircle, AlertTriangle, Download, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  type SiteConfig, 
  type WeeklySchedule, 
  type AlertConfig, 
  type VillageBreakdown,
  type SiteInfo,
  type ScheduleState,
  type ScheduleEntry,
  DAYS, 
  SECTORS 
} from "@shared/schema";

const SCHEDULE_STATES: { value: ScheduleState; label: string }[] = [
  { value: "OUVERT", label: "OUVERT" },
  { value: "FERME", label: "FERMÉ" },
  { value: "FERMETURE_6H", label: "FERMETURE 6h" },
  { value: "OUVERTURE_17H", label: "OUVERTURE 17h" },
  { value: "OUVERTURE_6H", label: "OUVERTURE 6h" },
  { value: "FERMETURE_17H", label: "FERMETURE 17h" },
  { value: "OUVERTURE_7H_FERMETURE_17H", label: "7h - 17h" },
];

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", { username, password });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Connexion réussie" });
      onLogin();
    },
    onError: () => {
      setError("Identifiants incorrects");
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>Connectez-vous pour gérer le site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate()}
              data-testid="input-password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button 
            className="w-full gap-2" 
            onClick={() => loginMutation.mutate()}
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            <LogIn className="w-4 h-4" />
            {loginMutation.isPending ? "Connexion..." : "Se connecter"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Contactez l'administrateur pour obtenir vos identifiants
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface PdfParseResult {
  entries: ScheduleEntry[];
  rawText: string;
  confidence: "high" | "medium" | "low";
  message: string;
}

function ScheduleEditor({ schedule }: { schedule: WeeklySchedule }) {
  const [description, setDescription] = useState(schedule.description);
  const [entries, setEntries] = useState<ScheduleEntry[]>(schedule.entries);
  const [pdfResult, setPdfResult] = useState<PdfParseResult | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [isPdfParsing, setIsPdfParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/schedule", { 
        startDate: schedule.startDate, 
        endDate: schedule.endDate, 
        description, 
        entries 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Planning mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const getEntryState = (date: string, sector: string): ScheduleState => {
    const entry = entries.find(e => e.date === date && e.sector === sector);
    return entry?.state || "FERME";
  };

  const setEntryState = (date: string, sector: string, state: ScheduleState) => {
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.date === date && e.sector === sector));
      return [...filtered, { date, sector: sector as any, state }];
    });
  };

  const next31Days = Array.from({ length: 31 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0,0,0,0);
    return d;
  });

  const handlePdfUpload = async (file: File) => {
    setIsPdfParsing(true);
    setPdfResult(null);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/admin/parse-pdf", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const result: PdfParseResult = await res.json();
      setPdfResult(result);
    } catch (e) {
      toast({ title: "Erreur lors de la lecture du PDF", variant: "destructive" });
    } finally {
      setIsPdfParsing(false);
    }
  };

  const applyPdfEntries = () => {
    if (!pdfResult) return;
    setEntries(prev => {
      const merged = [...prev];
      for (const newEntry of pdfResult.entries) {
        const idx = merged.findIndex(e => e.date === newEntry.date && e.sector === newEntry.sector);
        if (idx >= 0) {
          merged[idx] = newEntry;
        } else {
          merged.push(newEntry);
        }
      }
      return merged;
    });
    toast({ title: `${pdfResult.entries.length} entrée(s) appliquée(s) au planning` });
    setPdfResult(null);
  };

  const confidenceColor = pdfResult?.confidence === "high" ? "bg-green-100 text-green-800" :
    pdfResult?.confidence === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  return (
    <div className="space-y-6">
      {/* PDF Import Section */}
      <div className="border-2 border-dashed border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Importer depuis un PDF</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Glissez un PDF officiel (SMAE, Préfecture...) et le système extraira automatiquement les données du planning.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          data-testid="input-pdf-upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePdfUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPdfParsing}
          data-testid="button-upload-pdf"
        >
          <Upload className="w-4 h-4" />
          {isPdfParsing ? "Analyse en cours..." : "Choisir un PDF"}
        </Button>

        {pdfResult && (
          <div className="space-y-3 border border-border rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              {pdfResult.confidence !== "low" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColor}`}>
                {pdfResult.confidence === "high" ? "Haute confiance" : pdfResult.confidence === "medium" ? "Confiance moyenne" : "Faible confiance"}
              </span>
            </div>
            <p className="text-sm">{pdfResult.message}</p>
            
            {pdfResult.entries.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Données détectées :</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {pdfResult.entries.map((e, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground">{e.date}</span>
                      <span>Secteur {e.sector}</span>
                      <span className="font-medium">{e.state}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={applyPdfEntries} className="gap-2" data-testid="button-apply-pdf">
                  <CheckCircle className="w-4 h-4" />
                  Appliquer au planning
                </Button>
              </div>
            )}

            {pdfResult.rawText && (
              <div className="space-y-1">
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setShowRawText(!showRawText)}
                  data-testid="button-toggle-raw-text"
                >
                  {showRawText ? "Masquer" : "Voir"} le texte extrait du PDF
                </button>
                {showRawText && (
                  <pre className="text-xs bg-background border border-border rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">
                    {pdfResult.rawText}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          data-testid="input-description"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border bg-muted p-2 text-left">Date</th>
              {SECTORS.map(sector => (
                <th key={sector} className="border border-border bg-muted p-2 text-center">
                  Secteur {sector}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {next31Days.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const displayDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
              return (
                <tr key={dateStr}>
                  <td className="border border-border p-2 font-medium capitalize">{displayDate}</td>
                  {SECTORS.map(sector => (
                    <td key={`${dateStr}-${sector}`} className="border border-border p-1">
                      <Select 
                        value={getEntryState(dateStr, sector)} 
                        onValueChange={(v) => setEntryState(dateStr, sector, v as ScheduleState)}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-${dateStr}-${sector}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_STATES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button 
        onClick={() => updateMutation.mutate()} 
        disabled={updateMutation.isPending}
        className="gap-2"
        data-testid="button-save-schedule"
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer le planning"}
      </Button>
    </div>
  );
}

function AlertEditor({ alert }: { alert: AlertConfig }) {
  const [isActive, setIsActive] = useState(alert.isActive);
  const [message, setMessage] = useState(alert.message);
  const [severity, setSeverity] = useState(alert.severity);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/alert", { isActive, message, severity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Alerte mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Activer l'alerte</Label>
          <p className="text-sm text-muted-foreground">
            Affiche la bannière d'alerte sur le site
          </p>
        </div>
        <Switch 
          checked={isActive} 
          onCheckedChange={setIsActive}
          data-testid="switch-alert-active"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alertMessage">Message d'alerte</Label>
        <Textarea 
          id="alertMessage" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Coupure d'eau imprévue dans le secteur Nord..."
          data-testid="input-alert-message"
        />
      </div>

      <div className="space-y-2">
        <Label>Niveau de gravité</Label>
        <Select value={severity} onValueChange={(v) => setSeverity(v as "warning" | "danger")}>
          <SelectTrigger data-testid="select-severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="warning">Avertissement (orange)</SelectItem>
            <SelectItem value="danger">Urgent (rouge)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={() => updateMutation.mutate()} 
        disabled={updateMutation.isPending}
        className="gap-2"
        data-testid="button-save-alert"
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer l'alerte"}
      </Button>
    </div>
  );
}

function VillageEditor({ villages }: { villages: VillageBreakdown }) {
  const [villageList, setVillageList] = useState(villages.villages);
  const [newVillage, setNewVillage] = useState("");
  const [newSector, setNewSector] = useState<string>("01");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/villages", { villages: villageList });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Villages mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const addVillage = () => {
    if (newVillage.trim()) {
      setVillageList([...villageList, { name: newVillage.trim(), sector: newSector as any }]);
      setNewVillage("");
    }
  };

  const removeVillage = (index: number) => {
    setVillageList(villageList.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Input 
          placeholder="Nom du village" 
          value={newVillage} 
          onChange={(e) => setNewVillage(e.target.value)}
          className="flex-1 min-w-[200px]"
          data-testid="input-new-village"
        />
        <Select value={newSector} onValueChange={setNewSector}>
          <SelectTrigger className="w-[140px]" data-testid="select-new-sector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map(s => (
              <SelectItem key={s} value={s}>Secteur {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addVillage} data-testid="button-add-village">Ajouter</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECTORS.map(sector => (
          <div key={sector} className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted p-2 font-semibold text-center">Secteur {sector}</div>
            <ul className="p-2 space-y-1 max-h-60 overflow-y-auto">
              {villageList.filter(v => v.sector === sector).map((village, idx) => {
                const globalIdx = villageList.findIndex(v => v === village);
                return (
                  <li key={idx} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                    <span>{village.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeVillage(globalIdx)}
                      className="h-6 w-6 p-0 text-red-500"
                      data-testid={`button-remove-village-${globalIdx}`}
                    >
                      X
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <Button 
        onClick={() => updateMutation.mutate()} 
        disabled={updateMutation.isPending}
        className="gap-2"
        data-testid="button-save-villages"
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les villages"}
      </Button>
    </div>
  );
}

function SiteInfoEditor({ siteInfo }: { siteInfo: SiteInfo }) {
  const [siteTitle, setSiteTitle] = useState(siteInfo.siteTitle);
  const [noticeTitle, setNoticeTitle] = useState(siteInfo.noticeTitle);
  const [noticeText, setNoticeText] = useState(siteInfo.noticeText);
  const [footerText, setFooterText] = useState(siteInfo.footerText);
  const [sourcesTitle, setSourcesTitle] = useState(siteInfo.sourcesTitle);
  const [sourcesDescription, setSourcesDescription] = useState(siteInfo.sourcesDescription);
  const [qrPromptText, setQrPromptText] = useState(siteInfo.qrPromptText);
  const [whatsappMessage, setWhatsappMessage] = useState(siteInfo.whatsappMessage);
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/site-info", {
        siteTitle, noticeTitle, noticeText, footerText,
        sourcesTitle, sourcesDescription, qrPromptText, whatsappMessage,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Textes du site mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const field = (label: string, value: string, onChange: (v: string) => void, testId: string, multiline = false) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={e => onChange(e.target.value)} data-testid={testId} rows={3} />
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} data-testid={testId} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Modifiez ici tous les textes affichés sur le site public. Les changements sont appliqués immédiatement après l'enregistrement.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">En-tête</h3>
        {field("Titre du site", siteTitle, setSiteTitle, "input-site-title")}
        {field("Message de partage WhatsApp", whatsappMessage, setWhatsappMessage, "input-whatsapp-message")}
        {field("Texte du prompt QR code IA", qrPromptText, setQrPromptText, "input-qr-prompt", true)}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Encadré "Important"</h3>
        {field("Titre de la notice", noticeTitle, setNoticeTitle, "input-notice-title")}
        {field("Contenu de la notice", noticeText, setNoticeText, "input-notice-text", true)}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Section sources</h3>
        {field("Titre", sourcesTitle, setSourcesTitle, "input-sources-title")}
        {field("Description", sourcesDescription, setSourcesDescription, "input-sources-description", true)}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pied de page</h3>
        {field("Texte du footer", footerText, setFooterText, "input-footer-text", true)}
      </div>

      <Button 
        onClick={() => updateMutation.mutate()} 
        disabled={updateMutation.isPending}
        className="gap-2"
        data-testid="button-save-site-info"
      >
        <Save className="w-4 h-4" />
        {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les textes"}
      </Button>
    </div>
  );
}

interface StoredEmailConfig {
  gmailUser: string;
  gmailAppPassword: string;
  backupEmail: string;
}

function EmailEditor() {
  const { toast } = useToast();
  const [gmailUser, setGmailUser] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [backupEmail, setBackupEmail] = useState("");

  const { data: emailData, isLoading } = useQuery<StoredEmailConfig>({
    queryKey: ["/api/admin/email-config"],
    retry: false,
  });

  useEffect(() => {
    if (emailData) {
      setGmailUser(emailData.gmailUser);
      setGmailAppPassword(emailData.gmailAppPassword);
      setBackupEmail(emailData.backupEmail);
    }
  }, [emailData]);

  if (!emailData && isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>;
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/email-config", {
        gmailUser, gmailAppPassword, backupEmail,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGmailAppPassword(data.gmailAppPassword);
      toast({ title: "Configuration email enregistrée" });
    },
    onError: () => toast({ title: "Erreur d'enregistrement", variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/test-email", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Échec du test — vérifiez les identifiants", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm text-blue-900 dark:text-blue-100 space-y-2">
        <p className="font-semibold">Comment ça fonctionne :</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Entrez votre adresse Gmail comme expéditeur</li>
          <li>Créez un <strong>mot de passe d'application</strong> sur <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">myaccount.google.com/apppasswords</a></li>
          <li>Entrez l'adresse email de destination (où recevoir les sauvegardes)</li>
          <li>À chaque modification du site, une sauvegarde complète est envoyée automatiquement</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gmail-user">Votre adresse Gmail (expéditeur)</Label>
          <Input
            id="gmail-user"
            type="email"
            placeholder="moncompte@gmail.com"
            value={gmailUser}
            onChange={e => setGmailUser(e.target.value)}
            data-testid="input-gmail-user"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gmail-pass">Mot de passe d'application Gmail</Label>
          <Input
            id="gmail-pass"
            type="password"
            placeholder={gmailAppPassword === "••••••••" ? "Mot de passe déjà configuré — saisir pour changer" : "xxxx xxxx xxxx xxxx"}
            value={gmailAppPassword === "••••••••" ? "" : gmailAppPassword}
            onChange={e => setGmailAppPassword(e.target.value)}
            data-testid="input-gmail-password"
          />
          <p className="text-xs text-muted-foreground">
            Pas votre mot de passe habituel — à générer depuis les paramètres de sécurité Google.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup-email">Adresse email de réception des sauvegardes</Label>
          <Input
            id="backup-email"
            type="email"
            placeholder="destination@gmail.com"
            value={backupEmail}
            onChange={e => setBackupEmail(e.target.value)}
            data-testid="input-backup-email"
          />
          <p className="text-xs text-muted-foreground">
            C'est ici que vous recevrez la sauvegarde à chaque modification du site.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
          data-testid="button-save-email-config"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>
        <Button
          variant="outline"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending || !backupEmail || !gmailUser}
          className="gap-2"
          data-testid="button-test-email"
        >
          {testMutation.isPending ? "Envoi en cours..." : "Envoyer un email de test"}
        </Button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  const adminTitle = config.siteInfo?.siteTitle 
    ? `Administration — ${config.siteInfo.siteTitle}` 
    : "Administration";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold" data-testid="text-admin-title">
              {adminTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/download-config" download data-testid="button-download-config">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <FileJson className="w-4 h-4" />
                Config JSON
              </Button>
            </a>
            <a href="/api/admin/download-site" download data-testid="button-download-site">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger le site</span>
                <span className="sm:hidden">ZIP</span>
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-admin">
            <TabsTrigger value="schedule" data-testid="tab-schedule">Planning</TabsTrigger>
            <TabsTrigger value="alert" data-testid="tab-alert">Alerte</TabsTrigger>
            <TabsTrigger value="villages" data-testid="tab-villages">Villages</TabsTrigger>
            <TabsTrigger value="site" data-testid="tab-site">Textes</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Modifier le planning</CardTitle>
                <CardDescription>
                  Importez un PDF officiel ou saisissez manuellement les états par date et secteur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleEditor schedule={config.schedule} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alert">
            <Card>
              <CardHeader>
                <CardTitle>Gérer la bannière d'alerte</CardTitle>
                <CardDescription>
                  Activez ou désactivez l'alerte et modifiez son contenu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertEditor alert={config.alert} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="villages">
            <Card>
              <CardHeader>
                <CardTitle>Découpage des villages</CardTitle>
                <CardDescription>
                  Gérez la répartition des villages par secteur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VillageEditor villages={config.villages} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="site">
            <Card>
              <CardHeader>
                <CardTitle>Textes du site</CardTitle>
                <CardDescription>
                  Modifiez tous les textes affichés sur le site public
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SiteInfoEditor siteInfo={config.siteInfo} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Sauvegarde automatique par email</CardTitle>
                <CardDescription>
                  À chaque modification du site, une sauvegarde complète est envoyée à l'adresse choisie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailEditor />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
