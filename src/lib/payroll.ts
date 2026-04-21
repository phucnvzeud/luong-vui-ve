// Vietnam payroll calculation engine (TPHCM, 2024)
// References: Luật BHXH 2014, Thông tư 111/2013/TT-BTC, Nghị quyết 954/2020

export type Region = 1 | 2 | 3 | 4;

export interface PayrollConfig {
  // Insurance rates - employee side
  bhxhEmpRate: number; // 0.08
  bhytEmpRate: number; // 0.015
  bhtnEmpRate: number; // 0.01
  // Insurance rates - employer side
  bhxhErRate: number; // 0.175
  bhytErRate: number; // 0.03
  bhtnErRate: number; // 0.01
  // Caps (multiplier x base salary). BHXH/BHYT cap = 20x mức lương cơ sở; BHTN cap = 20x lương tối thiểu vùng
  baseSalary: number; // mức lương cơ sở 2,340,000 (từ 1/7/2024)
  bhxhCapMultiplier: number; // 20
  // BHTN cap is region-based minimum wage * 20
  regionMinWages: Record<Region, number>;
  // Personal income tax
  personalDeduction: number; // 11,000,000
  dependentDeduction: number; // 4,400,000
  taxBrackets: { upTo: number | null; rate: number }[]; // lũy tiến
  // Default region
  defaultRegion: Region;
}

export const DEFAULT_CONFIG: PayrollConfig = {
  bhxhEmpRate: 0.08,
  bhytEmpRate: 0.015,
  bhtnEmpRate: 0.01,
  bhxhErRate: 0.175,
  bhytErRate: 0.03,
  bhtnErRate: 0.01,
  baseSalary: 2_340_000,
  bhxhCapMultiplier: 20,
  regionMinWages: {
    1: 4_960_000, // TPHCM thuộc vùng I
    2: 4_410_000,
    3: 3_860_000,
    4: 3_450_000,
  },
  personalDeduction: 11_000_000,
  dependentDeduction: 4_400_000,
  taxBrackets: [
    { upTo: 5_000_000, rate: 0.05 },
    { upTo: 10_000_000, rate: 0.1 },
    { upTo: 18_000_000, rate: 0.15 },
    { upTo: 32_000_000, rate: 0.2 },
    { upTo: 52_000_000, rate: 0.25 },
    { upTo: 80_000_000, rate: 0.3 },
    { upTo: null, rate: 0.35 },
  ],
  defaultRegion: 1,
};

export interface EmployeeInput {
  id: string;
  name: string;
  position?: string;
  grossSalary: number;        // tổng lương (gồm lương cơ bản + phụ cấp tính BH)
  insuranceSalary?: number;   // lương đóng BH (nếu khác gross). Mặc định = grossSalary
  nonTaxableAllowance: number; // phụ cấp không chịu thuế (ăn trưa tối đa 730k, điện thoại, công tác phí...)
  bonus: number;              // thưởng/OT chịu thuế
  dependents: number;
  region: Region;
}

export interface PayrollResult {
  grossSalary: number;
  insuranceSalary: number;
  cappedBhxhSalary: number;
  cappedBhtnSalary: number;
  bhxhEmp: number;
  bhytEmp: number;
  bhtnEmp: number;
  totalInsuranceEmp: number;
  bhxhEr: number;
  bhytEr: number;
  bhtnEr: number;
  totalInsuranceEr: number;
  taxableIncomeBeforeDeduction: number;
  personalDeduction: number;
  dependentDeduction: number;
  taxableIncome: number;
  pit: number;
  pitBreakdown: { bracket: string; rate: number; amount: number; tax: number }[];
  netSalary: number;
  totalCostToCompany: number;
}

export function calculatePayroll(emp: EmployeeInput, cfg: PayrollConfig = DEFAULT_CONFIG): PayrollResult {
  const insSalary = emp.insuranceSalary ?? emp.grossSalary;

  const bhxhCap = cfg.baseSalary * cfg.bhxhCapMultiplier;
  const bhtnCap = cfg.regionMinWages[emp.region] * 20;

  const cappedBhxhSalary = Math.min(insSalary, bhxhCap);
  const cappedBhtnSalary = Math.min(insSalary, bhtnCap);

  const bhxhEmp = cappedBhxhSalary * cfg.bhxhEmpRate;
  const bhytEmp = cappedBhxhSalary * cfg.bhytEmpRate;
  const bhtnEmp = cappedBhtnSalary * cfg.bhtnEmpRate;
  const totalInsuranceEmp = bhxhEmp + bhytEmp + bhtnEmp;

  const bhxhEr = cappedBhxhSalary * cfg.bhxhErRate;
  const bhytEr = cappedBhxhSalary * cfg.bhytErRate;
  const bhtnEr = cappedBhtnSalary * cfg.bhtnErRate;
  const totalInsuranceEr = bhxhEr + bhytEr + bhtnEr;

  // Thu nhập chịu thuế = Gross + Bonus - phụ cấp miễn thuế - BH bắt buộc của NV
  const taxableIncomeBeforeDeduction =
    emp.grossSalary + emp.bonus - emp.nonTaxableAllowance - totalInsuranceEmp;

  const personalDeduction = cfg.personalDeduction;
  const dependentDeduction = emp.dependents * cfg.dependentDeduction;

  const taxableIncome = Math.max(
    0,
    taxableIncomeBeforeDeduction - personalDeduction - dependentDeduction,
  );

  const { pit, breakdown } = calcPIT(taxableIncome, cfg.taxBrackets);

  const netSalary =
    emp.grossSalary + emp.bonus - totalInsuranceEmp - pit;

  const totalCostToCompany = emp.grossSalary + emp.bonus + totalInsuranceEr;

  return {
    grossSalary: emp.grossSalary,
    insuranceSalary: insSalary,
    cappedBhxhSalary,
    cappedBhtnSalary,
    bhxhEmp,
    bhytEmp,
    bhtnEmp,
    totalInsuranceEmp,
    bhxhEr,
    bhytEr,
    bhtnEr,
    totalInsuranceEr,
    taxableIncomeBeforeDeduction,
    personalDeduction,
    dependentDeduction,
    taxableIncome,
    pit,
    pitBreakdown: breakdown,
    netSalary,
    totalCostToCompany,
  };
}

function calcPIT(taxable: number, brackets: PayrollConfig["taxBrackets"]) {
  let remaining = taxable;
  let lower = 0;
  let pit = 0;
  const breakdown: PayrollResult["pitBreakdown"] = [];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const upper = b.upTo ?? Infinity;
    const slice = Math.min(remaining, upper - lower);
    if (slice > 0) {
      const tax = slice * b.rate;
      pit += tax;
      breakdown.push({
        bracket: b.upTo
          ? `${formatVND(lower)} - ${formatVND(b.upTo)}`
          : `Trên ${formatVND(lower)}`,
        rate: b.rate,
        amount: slice,
        tax,
      });
      remaining -= slice;
      lower = upper;
    } else {
      lower = upper;
    }
  }
  return { pit, breakdown };
}

export function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n)) + " ₫";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n));
}
