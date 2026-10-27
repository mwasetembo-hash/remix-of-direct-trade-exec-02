import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MWASELI12_PRESET, SOURCE_PRESET_NAME, sourceSettings } from "@/lib/source-settings";

const LS = "mwase-profiles";
type S = Record<string, unknown>;

export function Profiles({ settings, onApply, onLog, locked = false }: { settings: S; onApply: (s: any) => void; onLog: (m: string) => void; locked?: boolean }) {
  const [profiles, setProfiles] = useState<Record<string, S>>({});
  const [name, setName] = useState("");
  useEffect(() => { try { setProfiles(JSON.parse(localStorage.getItem(LS) || "{}")); } catch {} }, []);
  const store = (p: Record<string, S>) => { setProfiles(p); localStorage.setItem(LS, JSON.stringify(p)); };
  const field = "rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground";

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ current: settings, profiles }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mwase-settings.json"; a.click();
  };
  const importFile = async (f: File) => {
    try {
      const j = JSON.parse(await f.text());
      if (j.profiles) store({ ...profiles, ...j.profiles });
      if (j.current && !locked) onApply(j.current);
      onLog("Settings imported");
    } catch { onLog("Import failed: not a valid settings file"); }
  };

  return (
    <section className="glass space-y-2 rounded-sm p-4">
      <h2 className="font-semibold">Saved settings</h2>
      <div className="space-y-2 border-b border-border pb-3">
        <h3 className="text-sm font-semibold">{SOURCE_PRESET_NAME}</h3>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Market</dt><dd>Volatility 100 (1s)</dd>
          <dt className="text-muted-foreground">Contract</dt><dd>Only Ups / Downs</dd>
          <dt className="text-muted-foreground">Direction</dt><dd>Auto detect · one side</dd>
          <dt className="text-muted-foreground">Stake / ticks</dt><dd>{MWASELI12_PRESET.stake} / {MWASELI12_PRESET.duration}</dd>
          <dt className="text-muted-foreground">Requested offset</dt><dd>+{MWASELI12_PRESET.offset}</dd>
          <dt className="text-muted-foreground">Balance risk</dt><dd>1% maximum</dd>
        </dl>
        <Button variant="outline" disabled={locked} className="w-full" onClick={() => {
          const previous = { ...settings };
          const preset = sourceSettings(settings);
          store({ ...profiles, "Before Mwaseli12 import": previous, [SOURCE_PRESET_NAME]: { ...previous, ...preset } });
          onApply(preset);
          onLog("Mwaseli12 settings applied: 1HZ100V, Only Ups/Downs, auto direction, fixed stake 5, 5 ticks, requested offset +0.35, balance risk at most 1%. Existing session limits and stake cap retained; autopilot not started. Previous settings saved.");
        }}><Download size={14} />Apply Mwaseli12 settings</Button>
      </div>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" className={`flex-1 ${field}`} />
         <Button size="sm" disabled={!name.trim()} onClick={() => { store({ ...profiles, [name.trim()]: settings }); onLog(`Saved profile "${name.trim()}"`); setName(""); }}>Save</Button>
      </div>
      <div className="space-y-1">
        {Object.keys(profiles).length === 0 && <p className="text-xs text-muted-foreground">No saved profiles yet.</p>}
        {Object.entries(profiles).map(([n, p]) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="flex-1 truncate">{n}</span>
             <Button variant="outline" size="sm" disabled={locked} onClick={() => { onApply(p); onLog(`Loaded profile "${n}"`); }}>Load</Button>
             <Button variant="ghost" size="sm" onClick={() => { const c = { ...profiles }; delete c[n]; store(c); }}>Delete</Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 text-xs">
         <Button variant="outline" size="sm" onClick={exportAll}><Download />Export file</Button>
         <Button asChild variant="outline" size="sm"><label><Upload />Import file<input type="file" accept="application/json" hidden disabled={locked} onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} /></label></Button>
      </div>
    </section>
  );
}
