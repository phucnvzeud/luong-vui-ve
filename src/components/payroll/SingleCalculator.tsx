import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  calculatePayroll, formatVND, makeBlankEmployee,
  type EmployeeInput, type PayrollConfig, type Region, type ContractType,
} from "@/lib/payroll";
import {
  ArrowRight, Wallet, Receipt, Building2, TrendingDown,
  Briefcase, CalendarDays, Gift, ShieldCheck, Users, PiggyBank,
  Save, FolderOpen, Trash2, FilePlus2,
} from "lucide-react";

interface Props { config: PayrollConfig; }

const SAMPLE: EmployeeInput = {
  ...makeBlankEmployee("1", 1),
  employeeCode: "0001",
  name: "Nguyễn Văn A",
  position: "Trưởng phòng",
  department: "Kinh doanh",
  contractType: "Chính thức",
  agreedGrossSalary: 37_200_000,
  salaryAppliedRatio: 1,
  contractSalary: 37_200_000,
  insuranceSalary: 37_200_000,
  totalWorkingDays: 26,
  lunchAllowance: 730_000,
  uniformAllowance: 0,
  fixedPhoneAllowance: 170_000,
  housingNonTaxable: 0,
  transportationAllowance: 1_500_000,
  attendanceBonus: 500_000,
  performanceBonus: 20_000_000,
  housingTaxable: 0,
  otTaxable: 1_900_000,
  otherTaxable: 0,
  dependents: 2,
  additions: 0,
  otherDeductions: 0,
};

const STORAGE_KEY = "payrollvn:savedEmployees:v1";

type SavedEntry = { key: string; label: string; data: EmployeeInput };

function loadSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSaved(list: SavedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function SingleCalculator({ config }: Props) {
  const [emp, setEmp] = useState<EmployeeInput>(SAMPLE);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [loadKey, setLoadKey] = useState<string>("");
  const result = calculatePayroll(emp, config);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const buildKey = (e: EmployeeInput) =>
    (e.employeeCode?.trim() || e.name.trim() || `nv-${Date.now()}`).toLowerCase();

  const buildLabel = (e: EmployeeInput) => {
    const code = e.employeeCode?.trim();
    const name = e.name.trim() || "Không tên";
    return code ? `${code} — ${name}` : name;
  };

  const handleSave = () => {
    const key = buildKey(emp);
    const label = buildLabel(emp);
    const next = [...saved.filter((s) => s.key !== key), { key, label, data: emp }]
      .sort((a, b) => a.label.localeCompare(b.label, "vi"));
    setSaved(next);
    persistSaved(next);
    setLoadKey(key);
    toast.success(`Đã lưu "${label}" vào trình duyệt`);
  };

  const handleLoad = (key: string) => {
    const found = saved.find((s) => s.key === key);
    if (!found) return;
    setEmp(found.data);
    setLoadKey(key);
    toast.success(`Đã tải "${found.label}"`);
  };

  const handleDelete = () => {
    if (!loadKey) return;
    const target = saved.find((s) => s.key === loadKey);
    const next = saved.filter((s) => s.key !== loadKey);
    setSaved(next);
    persistSaved(next);
    setLoadKey("");
    if (target) toast.success(`Đã xoá "${target.label}"`);
  };

  const handleNew = () => {
    setEmp(makeBlankEmployee(crypto.randomUUID(), config.defaultRegion));
    setLoadKey("");
  };

  const update = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) =>
    setEmp((p) => ({ ...p, [key]: value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* INPUT — 7 nhóm */}
      <div className="lg:col-span-2 space-y-4">
        {/* Toolbar lưu/tải */}
        <Card className="p-4 shadow-soft border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Hồ sơ nhân viên đã lưu</h3>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Select value={loadKey || undefined} onValueChange={handleLoad}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={saved.length ? "Tải hồ sơ đã lưu…" : "Chưa có hồ sơ nào"} />
                </SelectTrigger>
                <SelectContent>
                  {saved.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleNew} title="Tạo mới">
                <FilePlus2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" size="sm">
                <Save className="h-3.5 w-3.5 mr-1" />
                Lưu hồ sơ hiện tại
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!loadKey}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Xoá
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá hồ sơ đã lưu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hồ sơ "{saved.find((s) => s.key === loadKey)?.label}" sẽ bị xoá khỏi trình duyệt. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Huỷ</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Xoá</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Lưu vào localStorage trình duyệt. Hồ sơ trùng Mã NV sẽ ghi đè.
            </p>
          </div>
        </Card>

        {/* Nhóm 1 */}
        <SectionCard
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          title="1. Thông tin nhân sự & cơ sở lương"
          subtitle="Thông tin HĐLĐ và mức lương thoả thuận"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã NV">
              <Input value={emp.employeeCode ?? ""} onChange={(e) => update("employeeCode", e.target.value)} />
            </Field>
            <Field label="Họ tên">
              <Input value={emp.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label="Chức vụ">
              <Input value={emp.position ?? ""} onChange={(e) => update("position", e.target.value)} />
            </Field>
            <Field label="Phòng ban">
              <Input value={emp.department ?? ""} onChange={(e) => update("department", e.target.value)} />
            </Field>
            <Field label="Loại HĐ">
              <Select value={emp.contractType ?? "Chính thức"} onValueChange={(v) => update("contractType", v as ContractType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Chính thức", "Thử việc", "Thời vụ", "Cộng tác viên"] as ContractType[]).map((c) =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>,
                  )}
                </SelectContent>
              </Select>
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
          <Field label="Agreed Gross Salary" hint="Mức lương thỏa thuận (Dealed Gross Income)">
            <NumInput value={emp.agreedGrossSalary} onChange={(v) => update("agreedGrossSalary", v)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary Applied (%)" hint="Tỷ lệ hưởng lương: 100% sau thử việc">
              <NumInput
                value={Math.round((emp.salaryAppliedRatio ?? 0) * 100)}
                onChange={(v) => update("salaryAppliedRatio", v / 100)}
              />
            </Field>
            <Field label="Contract Salary" hint="Lương ký HĐLĐ">
              <NumInput value={emp.contractSalary} onChange={(v) => update("contractSalary", v)} />
            </Field>
          </div>
          <Field label="Lương đóng BHXH/BHYT/BHTN" hint="Mặc định = Contract Salary">
            <NumInput value={emp.insuranceSalary} onChange={(v) => update("insuranceSalary", v)} />
          </Field>
        </SectionCard>

        {/* Nhóm 2 */}
        <SectionCard
          icon={<CalendarDays className="h-4 w-4 text-primary" />}
          title="2. Công & lương theo ngày"
          subtitle="Time sheet — công chuẩn & ngày công thực tế"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Working Days" hint="Ngày công thực tế (gồm phép có lương)">
              <NumInput value={emp.totalWorkingDays} onChange={(v) => update("totalWorkingDays", v)} />
            </Field>
            <Field label="Công chuẩn" hint={`Mặc định ${config.standardWorkingDays} ngày`}>
              <NumInput
                value={emp.standardWorkingDays ?? config.standardWorkingDays}
                onChange={(v) => update("standardWorkingDays", v)}
              />
            </Field>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Actual Salary = Contract × Salary Applied × Total Days / Công chuẩn ={" "}
            <span data-numeric className="text-foreground font-medium">
              {formatVND(result.actualSalaryForWorkedDays)}
            </span>
          </div>
        </SectionCard>

        {/* Nhóm 3a */}
        <SectionCard
          icon={<Gift className="h-4 w-4 text-primary" />}
          title="3a. Phụ cấp KHÔNG tính thuế"
          subtitle="Lunch, đồng phục, phone khoán, housing ≤ 15%"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lunch Allowance" hint="Toàn bộ miễn thuế">
              <NumInput value={emp.lunchAllowance} onChange={(v) => update("lunchAllowance", v)} />
            </Field>
            </Field>
            <Field label="Uniform">
              <NumInput value={emp.uniformAllowance} onChange={(v) => update("uniformAllowance", v)} />
            </Field>
            <Field label="Fixed Phone Allowance">
              <NumInput value={emp.fixedPhoneAllowance} onChange={(v) => update("fixedPhoneAllowance", v)} />
            </Field>
            <Field label="Housing (miễn thuế ≤15%)">
              <NumInput value={emp.housingNonTaxable} onChange={(v) => update("housingNonTaxable", v)} />
            </Field>
          </div>
        </SectionCard>

        {/* Nhóm 3b */}
        <SectionCard
          icon={<Gift className="h-4 w-4 text-warning-foreground" />}
          title="3b. Phụ cấp / Thưởng CHỊU thuế"
          subtitle="Xăng xe, chuyên cần, thưởng tháng, OT…"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Transportation">
              <NumInput value={emp.transportationAllowance} onChange={(v) => update("transportationAllowance", v)} />
            </Field>
            <Field label="Attendance">
              <NumInput value={emp.attendanceBonus} onChange={(v) => update("attendanceBonus", v)} />
            </Field>
            <Field label="Performance Bonus">
              <NumInput value={emp.performanceBonus} onChange={(v) => update("performanceBonus", v)} />
            </Field>
            <Field label="Housing (chịu thuế)">
              <NumInput value={emp.housingTaxable} onChange={(v) => update("housingTaxable", v)} />
            </Field>
            <Field label="OT (chịu thuế)">
              <NumInput value={emp.otTaxable} onChange={(v) => update("otTaxable", v)} />
            </Field>
            <Field label="Khác">
              <NumInput value={emp.otherTaxable} onChange={(v) => update("otherTaxable", v)} />
            </Field>
          </div>
        </SectionCard>

        {/* Nhóm 6 + 7 input */}
        <SectionCard
          icon={<Users className="h-4 w-4 text-primary" />}
          title="6/7. Giảm trừ & điều chỉnh"
          subtitle="NPT, bổ sung, khấu trừ khác"
        >
          <div className="grid grid-cols-3 gap-3">
            <Field label="Số NPT">
              <NumInput value={emp.dependents} onChange={(v) => update("dependents", v)} />
            </Field>
            <Field label="Bổ sung">
              <NumInput value={emp.additions} onChange={(v) => update("additions", v)} />
            </Field>
            <Field label="Khấu trừ khác">
              <NumInput value={emp.otherDeductions} onChange={(v) => update("otherDeductions", v)} />
            </Field>
          </div>
        </SectionCard>
      </div>

      {/* RESULT */}
      <div className="lg:col-span-3 space-y-4">
        {/* Net highlight */}
        <Card className="p-6 bg-hero text-primary-foreground shadow-elegant border-0 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Wallet className="h-4 w-4" />
              Net Take-home Salary
            </div>
            <div className="mt-2 text-4xl md:text-5xl font-bold tracking-tight" data-numeric>
              {formatVND(result.netTakeHome)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-primary-foreground/80">
              <span>Gross Income: <span data-numeric className="text-primary-foreground font-semibold">{formatVND(result.grossIncome)}</span></span>
              <span>Net sau PIT: <span data-numeric className="text-primary-foreground font-semibold">{formatVND(result.netAfterPIT)}</span></span>
              <span>Tổng chi phí DN: <span data-numeric className="text-accent font-semibold">{formatVND(result.totalCompanyExpenses)}</span></span>
            </div>
          </div>
        </Card>

        {/* Nhóm 4 — Tổng thu nhập */}
        <Card className="p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">4. Tổng thu nhập</h4>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Actual Salary (theo ngày công)" value={result.actualSalaryForWorkedDays} />
            <Row label="Tổng phụ cấp KHÔNG tính thuế" value={result.totalNonTaxableBenefits} muted />
            <Row label="Tổng phụ cấp CHỊU thuế" value={result.totalTaxableBenefits} muted />
            <Separator className="my-2" />
            <Row label="Gross Income" value={result.grossIncome} bold />
            <Row label="Taxable Income (= Gross − Non-taxable)" value={result.taxableIncomeGross} />
          </div>
        </Card>

        {/* Nhóm 3 — chi tiết phụ cấp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">Non-taxable Benefits</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              <Row label="Lunch (≤ cap)" value={result.nonTaxableBreakdown.lunch} muted />
              <Row label="Uniform" value={result.nonTaxableBreakdown.uniform} muted />
              <Row label="Phone (khoán)" value={result.nonTaxableBreakdown.phone} muted />
              <Row label="Housing (≤15%)" value={result.nonTaxableBreakdown.housing} muted />
              <Separator className="my-2" />
              <Row label="Tổng" value={result.totalNonTaxableBenefits} bold />
            </div>
          </Card>
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-warning-foreground" />
              <h4 className="font-semibold text-sm">Taxable Benefits</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              <Row label="Transportation" value={result.taxableBreakdown.transportation} muted />
              <Row label="Attendance" value={result.taxableBreakdown.attendance} muted />
              <Row label="Performance" value={result.taxableBreakdown.performance} muted />
              <Row label="Housing (vượt 15%)" value={result.taxableBreakdown.housing} muted />
              <Row label="OT" value={result.taxableBreakdown.ot} muted />
              <Row label="Khác" value={result.taxableBreakdown.other} muted />
              <Separator className="my-2" />
              <Row label="Tổng" value={result.totalTaxableBenefits} bold />
            </div>
          </Card>
        </div>

        {/* Nhóm 5 — BH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <h4 className="font-semibold text-sm">5. NLĐ đóng (10.5%)</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              <Row label="BHXH (8%)" value={result.bhxhEmp} muted />
              <Row label="BHYT (1.5%)" value={result.bhytEmp} muted />
              <Row label="BHTN (1%)" value={result.bhtnEmp} muted />
              <Separator className="my-2" />
              <Row label="Tổng NLĐ đóng" value={result.totalInsuranceEmp} bold tone="destructive" />
            </div>
          </Card>
          <Card className="p-5 shadow-soft border-accent/30 bg-accent/5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-accent-foreground" />
              <h4 className="font-semibold text-sm">5. Công ty đóng (22%)</h4>
            </div>
            <div className="space-y-1.5 text-sm">
              <Row label="BHXH (17.5%)" value={result.bhxhEr} muted />
              <Row label="BHYT (3%)" value={result.bhytEr} muted />
              <Row label="BHTN (1%)" value={result.bhtnEr} muted />
              <Row label="TNLĐ-BNN (0.5%)" value={result.tnldEr} muted />
              <Separator className="my-2" />
              <Row label="Tổng DN đóng" value={result.totalInsuranceEr} bold />
            </div>
          </Card>
        </div>

        {/* Nhóm 6 — PIT */}
        <Card className="p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-warning-foreground" />
            <h4 className="font-semibold text-sm">6. Khấu trừ & Thuế TNCN</h4>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Taxable Income" value={result.taxableIncomeGross} />
            <Row label="− Tổng BH (NLĐ)" value={-result.totalInsuranceEmp} muted />
            <Row label="− Giảm trừ bản thân" value={-result.personalDeduction} muted />
            <Row label={`− Giảm trừ ${emp.dependents} NPT`} value={-result.dependentDeduction} muted />
            <Separator className="my-2" />
            <Row label="TN tính thuế" value={result.taxableIncomeAfterDeductions} bold />
            <Row label="Thuế TNCN (PIT)" value={result.pit} bold tone="warning" />
          </div>
          {result.pitBreakdown.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1 text-xs">
                {result.pitBreakdown.map((b, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 py-1 border-b border-border/30 last:border-0">
                    <div className="col-span-5 text-muted-foreground">{b.bracket}</div>
                    <div className="col-span-2 font-medium">{(b.rate * 100).toFixed(0)}%</div>
                    <div className="col-span-2 text-right" data-numeric>{formatVND(b.amount)}</div>
                    <div className="col-span-3 text-right font-medium" data-numeric>{formatVND(b.tax)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Nhóm 7 */}
        <Card className="p-5 shadow-soft border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">7. Thực lãnh & Chi phí công ty</h4>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Net after PIT" value={result.netAfterPIT} />
            <Row label="+ Bổ sung" value={result.additions} muted />
            <Row label="− Khấu trừ khác" value={-result.otherDeductions} muted />
            <Separator className="my-2" />
            <Row label="Net Take-home Salary" value={result.netTakeHome} bold tone="primary" />
            <Row label="Total company expenses" value={result.totalCompanyExpenses} bold />
          </div>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Áp dụng quy định BHXH & TT 111/2013/TT-BTC · 2024</span>
          <a href="#bulk" className="inline-flex items-center gap-1 hover:text-foreground">
            Tính cho nhiều NV <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 shadow-soft border-border/60">
      <div className="flex items-start gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
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
  return (
    <Input
      data-numeric
      inputMode="numeric"
      value={value ? value.toLocaleString("vi-VN") : ""}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        onChange(raw ? Number(raw) : 0);
      }}
      className="font-mono"
    />
  );
}

function Row({
  label, value, bold, muted, tone,
}: { label: string; value: number; bold?: boolean; muted?: boolean; tone?: "destructive" | "warning" | "primary" }) {
  const toneClass =
    tone === "destructive" ? "text-destructive" :
    tone === "warning" ? "text-warning-foreground" :
    tone === "primary" ? "text-primary" : "";
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? "text-muted-foreground text-xs" : "text-sm"}`}>{label}</span>
      <span data-numeric className={`${bold ? "font-semibold" : ""} ${toneClass}`}>
        {formatVND(value)}
      </span>
    </div>
  );
}
