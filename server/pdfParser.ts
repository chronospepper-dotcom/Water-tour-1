import type { ScheduleEntry, ScheduleState, Sector } from "@shared/schema";

const STATE_KEYWORDS: { pattern: RegExp; state: ScheduleState }[] = [
  { pattern: /ouverture\s*7h?\s*[-–]\s*fermeture\s*17h?/i, state: "OUVERTURE_7H_FERMETURE_17H" },
  { pattern: /7h?\s*[-–]\s*17h?/i, state: "OUVERTURE_7H_FERMETURE_17H" },
  { pattern: /ouverture\s*[àa]?\s*6h?/i, state: "OUVERTURE_6H" },
  { pattern: /ouverture\s*[àa]?\s*17h?/i, state: "OUVERTURE_17H" },
  { pattern: /fermeture\s*[àa]?\s*6h?/i, state: "FERMETURE_6H" },
  { pattern: /fermeture\s*[àa]?\s*17h?/i, state: "FERMETURE_17H" },
  { pattern: /\bouvert\b/i, state: "OUVERT" },
  { pattern: /\bferm[eé]\b/i, state: "FERME" },
];

function detectState(text: string): ScheduleState | null {
  for (const { pattern, state } of STATE_KEYWORDS) {
    if (pattern.test(text)) return state;
  }
  return null;
}

function parseDate(dateStr: string): string | null {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Try YYYY-MM-DD already
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];
  return null;
}

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", fevrier: "02", mars: "03",
  avril: "04", mai: "05", juin: "06", juillet: "07",
  août: "08", aout: "08", septembre: "09", octobre: "10",
  novembre: "11", décembre: "12", decembre: "12",
};

function parseFrenchDate(text: string, year?: number): string | null {
  const y = year || new Date().getFullYear();
  const match = text.match(/(\d{1,2})\s+([a-zéûùàâê]+)\s*(\d{4})?/i);
  if (match) {
    const day = match[1].padStart(2, "0");
    const monthName = match[2].toLowerCase();
    const yr = match[3] ? parseInt(match[3]) : y;
    const month = FRENCH_MONTHS[monthName];
    if (month) return `${yr}-${month}-${day}`;
  }
  return null;
}

export interface ParsedScheduleResult {
  entries: ScheduleEntry[];
  rawText: string;
  confidence: "high" | "medium" | "low";
  message: string;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedScheduleResult> {
  let rawText = "";
  
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    rawText = data.text;
  } catch (e) {
    return {
      entries: [],
      rawText: "",
      confidence: "low",
      message: "Impossible de lire le PDF. Vérifiez que le fichier est valide.",
    };
  }

  const entries: ScheduleEntry[] = [];
  const lines = rawText.split(/\n/).map(l => l.trim()).filter(Boolean);
  const currentYear = new Date().getFullYear();

  // Strategy 1: Look for table-like rows with date + 4 sector columns
  // Pattern: a line with a date followed by sector states on same or next lines
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Try to find a date in this line
    let dateStr: string | null = parseDate(line);
    if (!dateStr) dateStr = parseFrenchDate(line, currentYear);
    
    if (dateStr) {
      // Look for sector states in surrounding lines (same line + next 4 lines)
      const contextLines = lines.slice(i, i + 6).join(" ");
      
      // Try to find 4 sector states
      const sectorMatches: ScheduleState[] = [];
      
      // Check if the line contains sector labels
      const sectorPattern = /secteur\s*0?([1-4])/gi;
      let sectorMatch;
      const sectorPositions: { sector: Sector; pos: number }[] = [];
      
      while ((sectorMatch = sectorPattern.exec(contextLines)) !== null) {
        const s = sectorMatch[1].padStart(2, "0") as Sector;
        sectorPositions.push({ sector: s, pos: sectorMatch.index });
      }
      
      if (sectorPositions.length === 0) {
        // Assume sectors are in order 01, 02, 03, 04
        let remaining = contextLines.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[a-zéûùàâê]+\s+\d{4}/gi, "");
        const allStates: ScheduleState[] = [];
        let tempText = remaining;
        
        for (const { pattern, state } of STATE_KEYWORDS) {
          if (pattern.test(tempText)) {
            allStates.push(state);
            tempText = tempText.replace(pattern, "MATCHED");
          }
        }
        
        if (allStates.length >= 1) {
          const sectors: Sector[] = ["01", "02", "03", "04"];
          for (let s = 0; s < Math.min(allStates.length, 4); s++) {
            entries.push({ date: dateStr, sector: sectors[s], state: allStates[s] });
          }
        }
      }
    }
    i++;
  }

  // Strategy 2: Find sector-specific blocks
  // e.g., "Secteur 01: OUVERT le 20/04", etc.
  if (entries.length === 0) {
    const fullText = rawText;
    const sectorBlockPattern = /secteur\s*0?([1-4])[^\n]*\n([^\n]+)/gi;
    let blockMatch;
    while ((blockMatch = sectorBlockPattern.exec(fullText)) !== null) {
      const sector = blockMatch[1].padStart(2, "0") as Sector;
      const blockContent = blockMatch[2];
      const state = detectState(blockContent);
      const dateStr = parseDate(blockContent) || parseFrenchDate(blockContent, currentYear);
      if (state && dateStr) {
        entries.push({ date: dateStr, sector, state });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = entries.filter(e => {
    const key = `${e.date}-${e.sector}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const confidence = unique.length >= 4 ? "high" : unique.length >= 1 ? "medium" : "low";
  const message = unique.length === 0
    ? "Aucune donnée de planning détectée. Le format du PDF n'est peut-être pas reconnu. Vérifiez le texte extrait ci-dessous."
    : `${unique.length} entrée(s) de planning détectée(s). Vérifiez et corrigez avant d'enregistrer.`;

  return { entries: unique, rawText, confidence, message };
}
