import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_CONFIG, type PayrollConfig } from "@/lib/payroll";
import { Settings2, RotateCcw, HardDriveDownload } from "lucide-react";

export const CONFIG_STORAGE_KEY = "payrollvn:config:v1";

interface Props {
  config: PayrollConfig;
  setConfig: (c: PayrollConfig) => void;
}

export function ConfigPanel({ config, setConfig }: Props) {
  const update = (patch: Partial<PayrollConfig>) => setConfig({ ...config, ...patch });

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    toast.success("Đã khôi phục công thức mặc định 2024");
  };

  return (
    <Card className="p-5 md:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Tùy chỉnh công thức</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <HardDriveDownload className="h-3 w-3" />
              Tự động lưu vào trình duyệt — áp dụng cho mọi lần tính
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />Mặc định 2024
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Tỷ lệ BHXH - Nhân viên đóng">
          <PctRow label="BHXH" value={config.bhxhEmpRate} onChange={(v) => update({ bhxhEmpRate: v })} />
          <PctRow label="BHYT" value={config.bhytEmpRate} onChange={(v) => update({ bhytEmpRate: v })} />
          <PctRow label="BHTN" value={config.bhtnEmpRate} onChange={(v) => update({ bhtnEmpRate: v })} />
        </Section>

        <Section title="Tỷ lệ BHXH - Doanh nghiệp đóng">
          <PctRow label="BHXH" value={config.bhxhErRate} onChange={(v) => update({ bhxhErRate: v })} />
          <PctRow label="BHYT" value={config.bhytErRate} onChange={(v) => update({ bhytErRate: v })} />
          <PctRow label="BHTN" value={config.bhtnErRate} onChange={(v) => update({ bhtnErRate: v })} />
        </Section>

        <Section title="Mức trần đóng bảo hiểm">
          <NumRow label="Mức lương cơ sở" value={config.baseSalary} onChange={(v) => update({ baseSalary: v })} suffix="₫" />
          <NumRow label="Hệ số trần BHXH/BHYT" value={config.bhxhCapMultiplier} onChange={(v) => update({ bhxhCapMultiplier: v })} suffix="x" small />
          <p className="text-[11px] text-muted-foreground">Trần BHXH/BHYT = {(config.baseSalary * config.bhxhCapMultiplier).toLocaleString("vi-VN")} ₫</p>
        </Section>

        <Section title="Lương tối thiểu vùng (BHTN trần = 20x)">
          {([1, 2, 3, 4] as const).map((r) => (
            <NumRow
              key={r}
              label={`Vùng ${r}`}
              value={config.regionMinWages[r]}
              onChange={(v) => update({ regionMinWages: { ...config.regionMinWages, [r]: v } })}
              suffix="₫"
            />
          ))}
        </Section>

        <Section title="Phụ cấp & công chuẩn">
          <NumRow label="Công chuẩn / tháng" value={config.standardWorkingDays} onChange={(v) => update({ standardWorkingDays: v })} suffix="ngày" small />
          <NumRow label="Đơn giá ăn trưa / ngày" value={config.lunchPerDay} onChange={(v) => update({ lunchPerDay: v })} suffix="₫" />
        </Section>

        <Section title="Giảm trừ thuế TNCN">
          <NumRow label="Giảm trừ bản thân" value={config.personalDeduction} onChange={(v) => update({ personalDeduction: v })} suffix="₫" />
          <NumRow label="Giảm trừ / người phụ thuộc" value={config.dependentDeduction} onChange={(v) => update({ dependentDeduction: v })} suffix="₫" />
        </Section>

        <Section title="Bậc thuế lũy tiến (TN tính thuế / tháng)">
          <div className="space-y-2">
            {config.taxBrackets.map((b, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-xs text-muted-foreground">B{i + 1}</span>
                <div className="col-span-7">
                  <Input
                    className="h-8 text-xs font-mono"
                    value={b.upTo === null ? "Không giới hạn" : b.upTo.toLocaleString("vi-VN")}
                    disabled={b.upTo === null}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const next = [...config.taxBrackets];
                      next[i] = { ...next[i], upTo: raw ? Number(raw) : 0 };
                      update({ taxBrackets: next });
                    }}
                  />
                </div>
                <div className="col-span-4 flex items-center gap-1">
                  <Input
                    className="h-8 text-xs font-mono text-right"
                    value={(b.rate * 100).toFixed(0)}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      const next = [...config.taxBrackets];
                      next[i] = { ...next[i], rate: v / 100 };
                      update({ taxBrackets: next });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
      <Separator className="opacity-0" />
    </div>
  );
}

function PctRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <Label className="col-span-6 text-xs">{label}</Label>
      <div className="col-span-6 flex items-center gap-1">
        <Input
          className="h-8 text-xs font-mono text-right"
          value={(value * 100).toFixed(2).replace(/\.?0+$/, "")}
          onChange={(e) => onChange(Number(e.target.value || 0) / 100)}
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function NumRow({ label, value, onChange, suffix, small }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; small?: boolean }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <Label className="col-span-6 text-xs">{label}</Label>
      <div className="col-span-6 flex items-center gap-1">
        <Input
          className="h-8 text-xs font-mono text-right"
          inputMode={small ? "decimal" : "numeric"}
          value={small ? value : value.toLocaleString("vi-VN")}
          onChange={(e) => {
            if (small) {
              const raw = e.target.value.replace(/[^\d.]/g, "");
              onChange(raw ? Number(raw) : 0);
            } else {
              const raw = e.target.value.replace(/[^\d]/g, "");
              onChange(raw ? Number(raw) : 0);
            }
          }}
        />
        {suffix && <span className="text-xs text-muted-foreground w-3">{suffix}</span>}
      </div>
    </div>
  );
}
