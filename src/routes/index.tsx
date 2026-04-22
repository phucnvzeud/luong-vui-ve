import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SingleCalculator } from "@/components/payroll/SingleCalculator";
import { BulkPayroll } from "@/components/payroll/BulkPayroll";
import { ConfigPanel, CONFIG_STORAGE_KEY } from "@/components/payroll/ConfigPanel";
import { ProfileBar } from "@/components/payroll/ProfileBar";
import { DEFAULT_CONFIG, type PayrollConfig } from "@/lib/payroll";
import {
  loadProfiles, saveProfiles, getLastProfileId, setLastProfileId,
  mergeConfig, makeId, type ConfigProfile,
} from "@/lib/profiles";
import { Calculator, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PayrollVN — Tính lương Net/Gross, BHXH, Thuế TNCN 2024" },
      { name: "description", content: "Công cụ tính lương dành cho doanh nghiệp Việt Nam (TP.HCM): tính BHXH, BHYT, BHTN, thuế TNCN lũy tiến, export Excel, tùy chỉnh công thức." },
    ],
  }),
});

function Index() {
  const [config, setConfig] = useState<PayrollConfig>(DEFAULT_CONFIG);
  const [profiles, setProfilesState] = useState<ConfigProfile[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate từ localStorage
  useEffect(() => {
    const list = loadProfiles();
    let nextProfiles = list;
    let nextActive: string | null = null;
    let nextConfig: PayrollConfig = DEFAULT_CONFIG;

    // Migration: nếu chưa có profile nào nhưng có config cũ → tạo profile "Mặc định"
    if (list.length === 0) {
      let legacy: PayrollConfig | null = null;
      try {
        const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (raw) legacy = mergeConfig(JSON.parse(raw));
      } catch { /* ignore */ }
      const seedConfig = legacy ?? DEFAULT_CONFIG;
      const seed: ConfigProfile = {
        id: makeId(),
        name: "Mặc định",
        config: seedConfig,
        updatedAt: Date.now(),
      };
      nextProfiles = [seed];
      nextActive = seed.id;
      nextConfig = seedConfig;
      saveProfiles(nextProfiles);
      setLastProfileId(seed.id);
    } else {
      const lastId = getLastProfileId();
      const found = list.find((p) => p.id === lastId) ?? list[0];
      nextActive = found.id;
      nextConfig = found.config;
    }

    setProfilesState(nextProfiles);
    setActiveIdState(nextActive);
    setConfig(nextConfig);
    setHydrated(true);
  }, []);

  // Persist profiles list
  const setProfiles = (list: ConfigProfile[]) => {
    setProfilesState(list);
    saveProfiles(list);
  };
  const setActiveId = (id: string | null) => {
    setActiveIdState(id);
    setLastProfileId(id);
  };

  // Auto-save config thay đổi vào profile đang active
  useEffect(() => {
    if (!hydrated || !activeId) return;
    setProfilesState((prev) => {
      const next = prev.map((p) => p.id === activeId ? { ...p, config, updatedAt: Date.now() } : p);
      saveProfiles(next);
      return next;
    });
  }, [config, activeId, hydrated]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-glow">
              <Calculator className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">PayrollVN</span>
            <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-0 backdrop-blur">
              <Sparkles className="h-3 w-3 mr-1" />2024 · TP.HCM
            </Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl text-balance">
            Tính lương <span className="text-accent">Net / Gross</span> cho doanh nghiệp Việt Nam
          </h1>
          <p className="mt-3 text-primary-foreground/80 max-w-2xl text-sm md:text-base">
            BHXH · BHYT · BHTN · Thuế TNCN lũy tiến · Phụ cấp tự động theo cấp · Profile cấu hình · Export Excel.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["BHXH 8% / 17.5%", "BHYT 1.5% / 3%", "BHTN 1% / 1%", "GTBT 11tr", "GTNPT 4.4tr", "Trần BH 46.8tr"].map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-primary-foreground/10 backdrop-blur border border-primary-foreground/10">
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10">
        <ProfileBar
          profiles={profiles}
          setProfiles={setProfiles}
          activeId={activeId}
          setActiveId={setActiveId}
          config={config}
          setConfig={setConfig}
        />

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="bg-muted/60 mb-6">
            <TabsTrigger value="single">Tính 1 nhân viên</TabsTrigger>
            <TabsTrigger value="bulk">Bảng lương</TabsTrigger>
            <TabsTrigger value="config">Tùy chỉnh công thức</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6 mt-0">
            <SingleCalculator config={config} />
          </TabsContent>

          <TabsContent value="bulk" className="mt-0">
            <BulkPayroll config={config} />
          </TabsContent>

          <TabsContent value="config" className="mt-0">
            <ConfigPanel config={config} setConfig={setConfig} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} PayrollVN — Công cụ tham khảo, vui lòng đối chiếu quy định BHXH & TT 111/2013/TT-BTC.</span>
          <span>Mức lương cơ sở: 2.340.000 ₫ (từ 01/07/2024)</span>
        </div>
      </footer>
    </div>
  );
}
