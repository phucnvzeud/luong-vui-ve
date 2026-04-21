import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { calculatePayroll, formatVND, type EmployeeInput, type PayrollConfig, type Region } from "@/lib/payroll";
import { ArrowRight, Wallet, Receipt, Building2, TrendingDown, Users, Briefcase } from "lucide-react";

interface Props {
  config: PayrollConfig;
}

export function SingleCalculator({ config }: Props) {
  const [emp, setEmp] = useState<EmployeeInput>({
    id: "1",
    name: "Nguyễn Văn A",
    position: "Nhân viên",
    grossSalary: 25_000_000,
    insuranceSalary: 25_000_000,
    nonTaxableAllowance: 730_000,
    bonus: 0,
    dependents: 0,
    region: 1 as Region,
  });

  const result = calculatePayroll(emp, config);

  const update = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) =>
    setEmp((p) => ({ ...p, [key]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Input */}
      <Card className="lg:col-span-2 p-6 shadow-soft border-border/60">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Thông tin nhân viên</h3>
            <p className="text-xs text-muted-foreground">Nhập số liệu để tính lương net</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Họ tên">
              <Input value={emp.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label="Chức vụ">
              <Input value={emp.position ?? ""} onChange={(e) => update("position", e.target.value)} />
            </Field>
          </div>

          <Field label="Lương Gross (VNĐ/tháng)" hint="Tổng lương trên hợp đồng trước thuế & BHXH">
            <NumInput value={emp.grossSalary} onChange={(v) => update("grossSalary", v)} />
          </Field>

          <Field label="Lương đóng BHXH" hint="Mặc định bằng Gross. Có thể thấp hơn theo HĐLĐ.">
            <NumInput value={emp.insuranceSalary ?? 0} onChange={(v) => update("insuranceSalary", v)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phụ cấp miễn thuế" hint="Ăn trưa ≤ 730k, điện thoại, đồng phục…">
              <NumInput value={emp.nonTaxableAllowance} onChange={(v) => update("nonTaxableAllowance", v)} />
            </Field>
            <Field label="Thưởng / OT chịu thuế">
              <NumInput value={emp.bonus} onChange={(v) => update("bonus", v)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Số người phụ thuộc">
              <NumInput value={emp.dependents} onChange={(v) => update("dependents", v)} />
            </Field>
            <Field label="Vùng lương tối thiểu">
              <Select value={String(emp.region)} onValueChange={(v) => update("region", Number(v) as Region)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Vùng I (TP.HCM, HN)</SelectItem>
                  <SelectItem value="2">Vùng II</SelectItem>
                  <SelectItem value="3">Vùng III</SelectItem>
                  <SelectItem value="4">Vùng IV</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      {/* Result */}
      <div className="lg:col-span-3 space-y-4">
        {/* Net highlight */}
        <Card className="p-6 bg-hero text-primary-foreground shadow-elegant border-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Wallet className="h-4 w-4" />
              Lương NET thực nhận
            </div>
            <div className="mt-2 text-4xl md:text-5xl font-bold tracking-tight" data-numeric>
              {formatVND(result.netSalary)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-primary-foreground/80">
              <span>Gross: <span data-numeric className="text-primary-foreground font-semibold">{formatVND(result.grossSalary)}</span></span>
              <span>Tổng chi phí DN: <span data-numeric className="text-accent font-semibold">{formatVND(result.totalCostToCompany)}</span></span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BreakdownCard
            icon={<TrendingDown className="h-4 w-4" />}
            title="Bảo hiểm bắt buộc (NV đóng)"
            total={result.totalInsuranceEmp}
            tone="destructive"
            rows={[
              ["BHXH (8%)", result.bhxhEmp],
              ["BHYT (1.5%)", result.bhytEmp],
              ["BHTN (1%)", result.bhtnEmp],
            ]}
          />
          <BreakdownCard
            icon={<Receipt className="h-4 w-4" />}
            title="Thuế TNCN"
            total={result.pit}
            tone="warning"
            rows={[
              ["TN trước giảm trừ", result.taxableIncomeBeforeDeduction],
              ["Giảm trừ bản thân", -result.personalDeduction],
              ["Giảm trừ phụ thuộc", -result.dependentDeduction],
              ["TN tính thuế", result.taxableIncome],
            ]}
          />
        </div>

        {/* PIT brackets */}
        {result.pitBreakdown.length > 0 && (
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Chi tiết thuế lũy tiến</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              {result.pitBreakdown.map((b, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="col-span-5 text-muted-foreground text-xs">{b.bracket}</div>
                  <div className="col-span-2 text-xs font-medium">{(b.rate * 100).toFixed(0)}%</div>
                  <div className="col-span-2 text-right text-xs" data-numeric>{formatVND(b.amount)}</div>
                  <div className="col-span-3 text-right font-medium" data-numeric>{formatVND(b.tax)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 shadow-soft border-accent/30 bg-accent/5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-accent-foreground" />
            <h4 className="font-semibold text-sm">Chi phí doanh nghiệp đóng thêm (21.5%)</h4>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Stat label="BHXH 17.5%" value={result.bhxhEr} />
            <Stat label="BHYT 3%" value={result.bhytEr} />
            <Stat label="BHTN 1%" value={result.bhtnEr} />
          </div>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng DN đóng thêm</span>
            <span className="font-semibold" data-numeric>{formatVND(result.totalInsuranceEr)}</span>
          </div>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Áp dụng quy định thuế & BHXH Việt Nam 2024</span>
          <a href="#bulk" className="inline-flex items-center gap-1 hover:text-foreground">
            Tính cho nhiều NV <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value ? value.toLocaleString("vi-VN") : "");
  return (
    <Input
      data-numeric
      inputMode="numeric"
      value={text}
      onFocus={() => setText(value ? String(value) : "")}
      onBlur={() => setText(value ? value.toLocaleString("vi-VN") : "")}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        setText(e.target.value);
        onChange(raw ? Number(raw) : 0);
      }}
      className="font-mono"
    />
  );
}

function BreakdownCard({
  icon, title, total, rows, tone,
}: {
  icon: React.ReactNode; title: string; total: number;
  rows: [string, number][]; tone: "destructive" | "warning";
}) {
  const toneClass = tone === "destructive" ? "text-destructive" : "text-warning-foreground";
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <span className={toneClass}>{icon}</span>
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className="space-y-1.5">
        {rows.map(([label, val]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span data-numeric className={val < 0 ? "text-muted-foreground" : ""}>{formatVND(val)}</span>
          </div>
        ))}
      </div>
      <Separator className="my-3" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tổng</span>
        <span className={`font-semibold ${toneClass}`} data-numeric>{formatVND(total)}</span>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-background/60 p-3 border border-border/50">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5" data-numeric>{formatVND(value)}</div>
    </div>
  );
}
