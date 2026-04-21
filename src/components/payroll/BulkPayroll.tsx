import { useState } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculatePayroll, formatNumber, type EmployeeInput, type PayrollConfig, type Region } from "@/lib/payroll";
import { Plus, Trash2, FileSpreadsheet, Users2 } from "lucide-react";

interface Props { config: PayrollConfig; }

const blank = (id: string): EmployeeInput => ({
  id, name: "", position: "",
  grossSalary: 0, insuranceSalary: 0,
  nonTaxableAllowance: 0, bonus: 0,
  dependents: 0, region: 1 as Region,
});

export function BulkPayroll({ config }: Props) {
  const [rows, setRows] = useState<EmployeeInput[]>([
    { id: "1", name: "Nguyễn Văn A", position: "Trưởng phòng", grossSalary: 35_000_000, insuranceSalary: 35_000_000, nonTaxableAllowance: 730_000, bonus: 5_000_000, dependents: 2, region: 1 },
    { id: "2", name: "Trần Thị B", position: "Nhân viên", grossSalary: 18_000_000, insuranceSalary: 18_000_000, nonTaxableAllowance: 730_000, bonus: 0, dependents: 1, region: 1 },
    { id: "3", name: "Lê Văn C", position: "Thực tập", grossSalary: 8_000_000, insuranceSalary: 8_000_000, nonTaxableAllowance: 500_000, bonus: 0, dependents: 0, region: 1 },
  ]);

  const update = (id: string, key: keyof EmployeeInput, value: any) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const add = () => setRows((p) => [...p, blank(String(Date.now()))]);
  const remove = (id: string) => setRows((p) => p.filter((r) => r.id !== id));

  const results = rows.map((r) => ({ emp: r, res: calculatePayroll(r, config) }));
  const totals = results.reduce(
    (a, { res }) => ({
      gross: a.gross + res.grossSalary,
      ins: a.ins + res.totalInsuranceEmp,
      pit: a.pit + res.pit,
      net: a.net + res.netSalary,
      cost: a.cost + res.totalCostToCompany,
    }),
    { gross: 0, ins: 0, pit: 0, net: 0, cost: 0 },
  );

  const exportExcel = () => {
    const data = results.map(({ emp, res }, i) => ({
      "STT": i + 1,
      "Họ tên": emp.name,
      "Chức vụ": emp.position ?? "",
      "Lương Gross": Math.round(res.grossSalary),
      "Lương đóng BH": Math.round(res.insuranceSalary),
      "Phụ cấp miễn thuế": Math.round(emp.nonTaxableAllowance),
      "Thưởng": Math.round(emp.bonus),
      "Số NPT": emp.dependents,
      "BHXH 8%": Math.round(res.bhxhEmp),
      "BHYT 1.5%": Math.round(res.bhytEmp),
      "BHTN 1%": Math.round(res.bhtnEmp),
      "Tổng BH (NV)": Math.round(res.totalInsuranceEmp),
      "Giảm trừ bản thân": Math.round(res.personalDeduction),
      "Giảm trừ NPT": Math.round(res.dependentDeduction),
      "TN tính thuế": Math.round(res.taxableIncome),
      "Thuế TNCN": Math.round(res.pit),
      "Lương NET": Math.round(res.netSalary),
      "BHXH DN 17.5%": Math.round(res.bhxhEr),
      "BHYT DN 3%": Math.round(res.bhytEr),
      "BHTN DN 1%": Math.round(res.bhtnEr),
      "Tổng chi phí DN": Math.round(res.totalCostToCompany),
    }));
    data.push({
      "STT": "" as any, "Họ tên": "TỔNG CỘNG", "Chức vụ": "",
      "Lương Gross": Math.round(totals.gross),
      "Lương đóng BH": 0, "Phụ cấp miễn thuế": 0, "Thưởng": 0, "Số NPT": 0,
      "BHXH 8%": 0, "BHYT 1.5%": 0, "BHTN 1%": 0,
      "Tổng BH (NV)": Math.round(totals.ins),
      "Giảm trừ bản thân": 0, "Giảm trừ NPT": 0, "TN tính thuế": 0,
      "Thuế TNCN": Math.round(totals.pit),
      "Lương NET": Math.round(totals.net),
      "BHXH DN 17.5%": 0, "BHYT DN 3%": 0, "BHTN DN 1%": 0,
      "Tổng chi phí DN": Math.round(totals.cost),
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] || {}).map((k) =>
      ["Họ tên", "Chức vụ"].includes(k) ? { wch: 20 } : { wch: 16 },
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
            <p className="text-xs text-muted-foreground">{rows.length} nhân viên · Tổng NET <span data-numeric className="text-foreground font-medium">{formatNumber(totals.net)} ₫</span></p>
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
              {["#", "Họ tên", "Chức vụ", "Gross", "Lương BH", "PC miễn thuế", "Thưởng", "NPT", "Vùng", "BH (NV)", "Thuế TNCN", "NET", "Cost DN", ""].map((h, i) => (
                <th key={i} className="text-left font-medium py-2 px-2 border-b border-border whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(({ emp, res }, i) => (
              <tr key={emp.id} className="hover:bg-muted/40">
                <td className="py-2 px-2 border-b border-border/50 text-muted-foreground text-xs">{i + 1}</td>
                <td className="py-1 px-1 border-b border-border/50 min-w-[160px]">
                  <Input className="h-8 text-sm" value={emp.name} onChange={(e) => update(emp.id, "name", e.target.value)} />
                </td>
                <td className="py-1 px-1 border-b border-border/50 min-w-[140px]">
                  <Input className="h-8 text-sm" value={emp.position ?? ""} onChange={(e) => update(emp.id, "position", e.target.value)} />
                </td>
                <CellNum value={emp.grossSalary} onChange={(v) => update(emp.id, "grossSalary", v)} />
                <CellNum value={emp.insuranceSalary ?? 0} onChange={(v) => update(emp.id, "insuranceSalary", v)} />
                <CellNum value={emp.nonTaxableAllowance} onChange={(v) => update(emp.id, "nonTaxableAllowance", v)} />
                <CellNum value={emp.bonus} onChange={(v) => update(emp.id, "bonus", v)} />
                <td className="py-1 px-1 border-b border-border/50 w-16">
                  <Input className="h-8 text-sm font-mono text-center" type="number" min={0} value={emp.dependents} onChange={(e) => update(emp.id, "dependents", Number(e.target.value || 0))} />
                </td>
                <td className="py-1 px-1 border-b border-border/50 w-20">
                  <Select value={String(emp.region)} onValueChange={(v) => update(emp.id, "region", Number(v))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((r) => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-2 border-b border-border/50 text-right font-mono text-xs text-destructive whitespace-nowrap">{formatNumber(res.totalInsuranceEmp)}</td>
                <td className="py-2 px-2 border-b border-border/50 text-right font-mono text-xs text-warning-foreground whitespace-nowrap">{formatNumber(res.pit)}</td>
                <td className="py-2 px-2 border-b border-border/50 text-right font-mono text-sm font-semibold text-primary whitespace-nowrap">{formatNumber(res.netSalary)}</td>
                <td className="py-2 px-2 border-b border-border/50 text-right font-mono text-xs text-muted-foreground whitespace-nowrap">{formatNumber(res.totalCostToCompany)}</td>
                <td className="py-1 px-1 border-b border-border/50">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(emp.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="bg-primary/5 font-semibold">
              <td colSpan={9} className="py-3 px-2 text-sm">TỔNG CỘNG ({rows.length} NV)</td>
              <td className="py-3 px-2 text-right font-mono text-xs text-destructive">{formatNumber(totals.ins)}</td>
              <td className="py-3 px-2 text-right font-mono text-xs text-warning-foreground">{formatNumber(totals.pit)}</td>
              <td className="py-3 px-2 text-right font-mono text-sm text-primary">{formatNumber(totals.net)}</td>
              <td className="py-3 px-2 text-right font-mono text-xs">{formatNumber(totals.cost)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CellNum({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <td className="py-1 px-1 border-b border-border/50 min-w-[120px]">
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
