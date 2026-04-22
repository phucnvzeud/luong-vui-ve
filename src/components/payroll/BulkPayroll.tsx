import { useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  calculatePayroll, formatNumber, makeBlankEmployee, EMPLOYEE_LEVELS,
  type EmployeeInput, type PayrollConfig, type Region, type EmployeeLevel,
} from "@/lib/payroll";
import { Plus, Trash2, FileSpreadsheet, Users2 } from "lucide-react";

interface Props { config: PayrollConfig; }

const samples: EmployeeInput[] = [
  {
    ...makeBlankEmployee("1", 1),
    employeeCode: "0001", name: "Nguyễn Văn A", position: "Trưởng phòng", department: "Kinh doanh",
    level: "Quản lý",
    agreedGrossSalary: 37_200_000, salaryAppliedRatio: 1, contractSalary: 37_200_000, insuranceSalary: 37_200_000,
    totalWorkingDays: 22,
    lunchAllowance: 1_100_000,
    dependents: 2,
  },
  {
    ...makeBlankEmployee("2", 1),
    employeeCode: "0002", name: "Trần Thị B", position: "Nhân viên", department: "Kế toán",
    level: "Chuyên viên",
    agreedGrossSalary: 18_000_000, salaryAppliedRatio: 1, contractSalary: 18_000_000, insuranceSalary: 18_000_000,
    totalWorkingDays: 22,
    lunchAllowance: 1_100_000,
    dependents: 1,
  },
  {
    ...makeBlankEmployee("3", 1),
    employeeCode: "0003", name: "Lê Văn C", position: "Thực tập", department: "IT",
    level: "Khác",
    agreedGrossSalary: 8_000_000, salaryAppliedRatio: 0.85, contractSalary: 8_000_000, insuranceSalary: 8_000_000,
    totalWorkingDays: 20,
    lunchAllowance: 1_000_000,
  },
];

export function BulkPayroll({ config }: Props) {
  const [rows, setRows] = useState<EmployeeInput[]>(samples);

  const update = <K extends keyof EmployeeInput>(id: string, key: K, value: EmployeeInput[K]) =>
    setRows((p) => p.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, [key]: value };
      if (key === "totalWorkingDays") {
        next.lunchAllowance = Math.max(0, Number(value) || 0) * config.lunchPerDay;
      }
      return next;
    }));

  const add = () => setRows((p) => [...p, makeBlankEmployee(String(Date.now()), 1)]);
  const remove = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

  const results = rows.map((r) => ({ emp: r, res: calculatePayroll(r, config) }));
  const totals = results.reduce(
    (a, { res }) => ({
      gross: a.gross + res.grossIncome,
      ins: a.ins + res.totalInsuranceEmp,
      pit: a.pit + res.pit,
      net: a.net + res.netTakeHome,
      cost: a.cost + res.totalCompanyExpenses,
    }),
    { gross: 0, ins: 0, pit: 0, net: 0, cost: 0 },
  );

  const exportExcel = () => {
    const data = results.map(({ emp, res }, i) => ({
      "STT": i + 1,
      "Mã NV": emp.employeeCode ?? "",
      "Họ tên": emp.name,
      "Chức vụ": emp.position ?? "",
      "Phòng ban": emp.department ?? "",
      "Loại HĐ": emp.contractType ?? "",
      "Agreed Gross": Math.round(emp.agreedGrossSalary),
      "Salary Applied %": Math.round((emp.salaryAppliedRatio ?? 0) * 100),
      "Contract Salary": Math.round(emp.contractSalary),
      "Lương đóng BH": Math.round(emp.insuranceSalary),
      "Total Working Days": emp.totalWorkingDays,
      "Công chuẩn": emp.standardWorkingDays ?? config.standardWorkingDays,
      "Actual Salary": Math.round(res.actualSalaryForWorkedDays),
      "Lunch (NT)": Math.round(res.nonTaxableBreakdown.lunch),
      "Uniform": Math.round(res.nonTaxableBreakdown.uniform),
      "Phone (NT)": Math.round(res.nonTaxableBreakdown.phone),
      "Housing (NT)": Math.round(res.nonTaxableBreakdown.housing),
      "Total Non-taxable": Math.round(res.totalNonTaxableBenefits),
      "Transportation": Math.round(res.taxableBreakdown.transportation),
      "Attendance": Math.round(res.taxableBreakdown.attendance),
      "Performance": Math.round(res.taxableBreakdown.performance),
      "Housing (T)": Math.round(res.taxableBreakdown.housing),
      "OT": Math.round(res.taxableBreakdown.ot),
      "Khác (T)": Math.round(res.taxableBreakdown.other),
      "Total Taxable Benefits": Math.round(res.totalTaxableBenefits),
      "Gross Income": Math.round(res.grossIncome),
      "Taxable Income": Math.round(res.taxableIncomeGross),
      "BHXH 8%": Math.round(res.bhxhEmp),
      "BHYT 1.5%": Math.round(res.bhytEmp),
      "BHTN 1%": Math.round(res.bhtnEmp),
      "Tổng BH (NLĐ)": Math.round(res.totalInsuranceEmp),
      "BHXH DN 17.5%": Math.round(res.bhxhEr),
      "BHYT DN 3%": Math.round(res.bhytEr),
      "BHTN DN 1%": Math.round(res.bhtnEr),
      "TNLĐ 0.5%": Math.round(res.tnldEr),
      "Tổng BH (DN)": Math.round(res.totalInsuranceEr),
      "Số NPT": emp.dependents,
      "Giảm trừ bản thân": Math.round(res.personalDeduction),
      "Giảm trừ NPT": Math.round(res.dependentDeduction),
      "TN tính thuế": Math.round(res.taxableIncomeAfterDeductions),
      "Thuế TNCN": Math.round(res.pit),
      "Net after PIT": Math.round(res.netAfterPIT),
      "Bổ sung": Math.round(emp.additions),
      "Khấu trừ khác": Math.round(emp.otherDeductions),
      "Net Take-home": Math.round(res.netTakeHome),
      "Total Company Expenses": Math.round(res.totalCompanyExpenses),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map((k) =>
      ["Họ tên", "Chức vụ", "Phòng ban", "Loại HĐ"].includes(k) ? { wch: 18 } : { wch: 14 },
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bảng lương");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `bang-luong-${date}.xlsx`);
  };

  return (
    <Card className="p-5 md:p-6 shadow-soft" id="bulk">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Bảng lương nhiều nhân viên</h3>
            <p className="text-xs text-muted-foreground">
              {rows.length} NV · Tổng Net Take-home{" "}
              <span data-numeric className="text-foreground font-medium">{formatNumber(totals.net)} ₫</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={add} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Thêm NV</Button>
          <Button onClick={exportExcel} size="sm" className="bg-primary hover:bg-primary/90">
            <FileSpreadsheet className="h-4 w-4 mr-1" />Export Excel
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-xs text-muted-foreground">
              {[
                "#", "Mã NV", "Họ tên", "Cấp", "Chức vụ", "Contract Salary", "Lương BH",
                "Công", "Lunch", "Phone", "Transport", "Performance", "OT",
                "NPT", "Vùng", "Gross Income", "BH (NLĐ)", "PIT", "Net Take-home", "Cost DN", "",
              ].map((h, i) => (
                <th key={i} className="text-left font-medium py-2 px-2 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(({ emp, res }, i) => (
              <tr key={emp.id} className="hover:bg-muted/40">
                <td className="py-2 px-2 border-b border-border/50 text-muted-foreground text-xs">{i + 1}</td>
                <CellText value={emp.employeeCode ?? ""} onChange={(v) => update(emp.id, "employeeCode", v)} w="min-w-[80px]" />
                <CellText value={emp.name} onChange={(v) => update(emp.id, "name", v)} w="min-w-[160px]" />
                <td className="py-1 px-1 border-b border-border/50 w-[120px]">
                  <Select
                    value={emp.level ?? "__none__"}
                    onValueChange={(v) => update(emp.id, "level", v === "__none__" ? undefined : (v as EmployeeLevel))}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {EMPLOYEE_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <CellText value={emp.position ?? ""} onChange={(v) => update(emp.id, "position", v)} w="min-w-[130px]" />
                <CellNum value={emp.contractSalary} onChange={(v) => update(emp.id, "contractSalary", v)} />
                <CellNum value={emp.insuranceSalary} onChange={(v) => update(emp.id, "insuranceSalary", v)} />
                <CellNum value={emp.totalWorkingDays} onChange={(v) => update(emp.id, "totalWorkingDays", v)} small />
                <CellNum value={emp.lunchAllowance} onChange={(v) => update(emp.id, "lunchAllowance", v)} />
                <CellNum value={emp.fixedPhoneAllowance} onChange={(v) => update(emp.id, "fixedPhoneAllowance", v)} />
                <CellNum value={emp.transportationAllowance} onChange={(v) => update(emp.id, "transportationAllowance", v)} />
                <CellNum value={emp.performanceBonus} onChange={(v) => update(emp.id, "performanceBonus", v)} />
                <CellNum value={emp.otTaxable} onChange={(v) => update(emp.id, "otTaxable", v)} />
                <td className="py-1 px-1 border-b border-border/50 w-14">
                  <Input className="h-8 text-sm font-mono text-center" type="number" min={0} value={emp.dependents}
                    onChange={(e) => update(emp.id, "dependents", Number(e.target.value || 0))} />
                </td>
                <td className="py-1 px-1 border-b border-border/50 w-20">
                  <Select value={String(emp.region)} onValueChange={(v) => update(emp.id, "region", Number(v) as Region)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((r) => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <NumOut value={res.grossIncome} />
                <NumOut value={res.totalInsuranceEmp} className="text-destructive" />
                <NumOut value={res.pit} className="text-warning-foreground" />
                <NumOut value={res.netTakeHome} className="text-primary font-semibold" />
                <NumOut value={res.totalCompanyExpenses} className="text-muted-foreground" />
                <td className="py-1 px-1 border-b border-border/50">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(emp.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="bg-primary/5 font-semibold">
              <td colSpan={15} className="py-3 px-2 text-sm">TỔNG CỘNG ({rows.length} NV)</td>
              <NumOut value={totals.gross} />
              <NumOut value={totals.ins} className="text-destructive" />
              <NumOut value={totals.pit} className="text-warning-foreground" />
              <NumOut value={totals.net} className="text-primary" />
              <NumOut value={totals.cost} />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CellText({ value, onChange, w }: { value: string; onChange: (v: string) => void; w?: string }) {
  return (
    <td className={`py-1 px-1 border-b border-border/50 ${w ?? ""}`}>
      <Input className="h-8 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </td>
  );
}

function CellNum({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  return (
    <td className={`py-1 px-1 border-b border-border/50 ${small ? "w-16" : "min-w-[120px]"}`}>
      <Input
        className="h-8 text-sm font-mono text-right"
        inputMode="numeric"
        value={value ? value.toLocaleString("vi-VN") : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          onChange(raw ? Number(raw) : 0);
        }}
      />
    </td>
  );
}

function NumOut({ value, className }: { value: number; className?: string }) {
  return (
    <td className={`py-2 px-2 border-b border-border/50 text-right font-mono text-xs whitespace-nowrap ${className ?? ""}`}>
      {formatNumber(value)}
    </td>
  );
}
