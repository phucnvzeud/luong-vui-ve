// Vietnam payroll calculation engine — 2024
// Cấu trúc 7 nhóm:
// 1. Thông tin nhân sự & cơ sở lương
// 2. Công & lương theo ngày công
// 3. Phụ cấp / thu nhập ngoài lương (non-taxable & taxable)
// 4. Tổng thu nhập & cơ sở tính thuế
// 5. Bảo hiểm bắt buộc (NLĐ + NSDLĐ, có TNLĐ-BNN)
// 6. Khấu trừ & thuế TNCN lũy tiến
// 7. Thực lãnh & tổng chi phí công ty

export type Region = 1 | 2 | 3 | 4;
export type ContractType = "Chính thức" | "Thử việc" | "Thời vụ" | "Cộng tác viên";

export interface PayrollConfig {
  // BH - NLĐ (10.5%)
  bhxhEmpRate: number;
  bhytEmpRate: number;
  bhtnEmpRate: number;
  // BH - NSDLĐ (21.5% + 0.5% TNLĐ)
  bhxhErRate: number;
  bhytErRate: number;
  bhtnErRate: number;
  tnldErRate: number; // Tai nạn lao động - Bệnh nghề nghiệp
  // Trần đóng BH
  baseSalary: number; // mức lương cơ sở
  bhxhCapMultiplier: number; // 20x lương cơ sở cho BHXH/BHYT
  regionMinWages: Record<Region, number>; // 20x lương tối thiểu vùng cho BHTN
  // PIT
  personalDeduction: number;
  dependentDeduction: number;
  taxBrackets: { upTo: number | null; rate: number }[];
  // Công chuẩn & phụ cấp giới hạn
  standardWorkingDays: number; // công chuẩn / tháng (mặc định 26)
  lunchAllowanceCap: number; // ăn trưa miễn thuế tối đa (730k/tháng)
  housingNonTaxableRatio: number; // tối đa 15% TN chịu thuế (không gồm chính housing)
  defaultRegion: Region;
}

export const DEFAULT_CONFIG: PayrollConfig = {
  bhxhEmpRate: 0.08,
  bhytEmpRate: 0.015,
  bhtnEmpRate: 0.01,
  bhxhErRate: 0.175,
  bhytErRate: 0.03,
  bhtnErRate: 0.01,
  tnldErRate: 0.005,
  baseSalary: 2_340_000,
  bhxhCapMultiplier: 20,
  regionMinWages: {
    1: 4_960_000,
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
  standardWorkingDays: 26,
  lunchAllowanceCap: 730_000,
  housingNonTaxableRatio: 0.15,
  defaultRegion: 1,
};

export interface EmployeeInput {
  // Nhóm 1 — Thông tin nhân sự
  id: string;
  employeeCode?: string;
  name: string;
  position?: string;
  department?: string;
  contractType?: ContractType;

  // Cơ sở lương
  agreedGrossSalary: number;   // Dealed Gross Income
  salaryAppliedRatio: number;  // % hưởng lương (1 = 100%)
  contractSalary: number;      // Lương ký HĐLĐ
  insuranceSalary: number;     // Lương đóng BHXH/BHYT/BHTN

  // Nhóm 2 — Công
  totalWorkingDays: number;
  standardWorkingDays?: number; // override công chuẩn nếu cần

  // Nhóm 3 — Phụ cấp không tính thuế
  lunchAllowance: number;
  uniformAllowance: number;
  fixedPhoneAllowance: number;
  housingNonTaxable: number;

  // Nhóm 3 — Phụ cấp tính thuế
  transportationAllowance: number;
  attendanceBonus: number;
  performanceBonus: number;
  housingTaxable: number;
  otTaxable: number;
  otherTaxable: number;

  // Nhóm 6 — NPT
  dependents: number;

  // Nhóm 7 — Bổ sung / khấu trừ khác
  additions: number;
  otherDeductions: number;

  region: Region;
}

export interface PayrollResult {
  // Nhóm 1
  agreedGrossSalary: number;
  contractSalary: number;
  insuranceSalary: number;

  // Nhóm 2
  totalWorkingDays: number;
  standardWorkingDays: number;
  actualSalaryForWorkedDays: number;

  // Nhóm 3
  totalNonTaxableBenefits: number;
  totalTaxableBenefits: number;
  nonTaxableBreakdown: { lunch: number; uniform: number; phone: number; housing: number };
  taxableBreakdown: {
    transportation: number;
    attendance: number;
    performance: number;
    housing: number;
    ot: number;
    other: number;
  };

  // Nhóm 4
  grossIncome: number;          // Tổng thu nhập
  taxableIncomeGross: number;   // Thu nhập chịu thuế (= Gross - NonTaxable)

  // Nhóm 5
  cappedBhxhSalary: number;
  cappedBhtnSalary: number;
  bhxhEmp: number;
  bhytEmp: number;
  bhtnEmp: number;
  totalInsuranceEmp: number;
  bhxhEr: number;
  bhytEr: number;
  bhtnEr: number;
  tnldEr: number;
  totalInsuranceEr: number;

  // Nhóm 6
  personalDeduction: number;
  dependentDeduction: number;
  taxableIncomeAfterDeductions: number; // TN tính thuế
  pit: number;
  pitBreakdown: { bracket: string; rate: number; amount: number; tax: number }[];

  // Nhóm 7
  netAfterPIT: number;
  additions: number;
  otherDeductions: number;
  netTakeHome: number;
  totalCompanyExpenses: number;
}

export function makeBlankEmployee(id: string, region: Region = 1): EmployeeInput {
  return {
    id,
    employeeCode: "",
    name: "",
    position: "",
    department: "",
    contractType: "Chính thức",
    agreedGrossSalary: 0,
    salaryAppliedRatio: 1,
    contractSalary: 0,
    insuranceSalary: 0,
    totalWorkingDays: 26,
    lunchAllowance: 0,
    uniformAllowance: 0,
    fixedPhoneAllowance: 0,
    housingNonTaxable: 0,
    transportationAllowance: 0,
    attendanceBonus: 0,
    performanceBonus: 0,
    housingTaxable: 0,
    otTaxable: 0,
    otherTaxable: 0,
    dependents: 0,
    additions: 0,
    otherDeductions: 0,
    region,
  };
}

export function calculatePayroll(emp: EmployeeInput, cfg: PayrollConfig = DEFAULT_CONFIG): PayrollResult {
  const standardDays = emp.standardWorkingDays && emp.standardWorkingDays > 0
    ? emp.standardWorkingDays
    : cfg.standardWorkingDays;

  // Nhóm 2 — Lương theo ngày công
  const actualSalaryForWorkedDays = standardDays > 0
    ? (emp.contractSalary * emp.salaryAppliedRatio * emp.totalWorkingDays) / standardDays
    : 0;

  // Nhóm 3 — Phụ cấp
  // Ăn trưa: toàn bộ là phụ cấp không tính thuế (không áp dụng cap)
  const lunchNonTaxable = emp.lunchAllowance;

  const nonTaxableBeforeHousing =
    lunchNonTaxable + emp.uniformAllowance + emp.fixedPhoneAllowance;

  // Cơ sở để tính trần housing miễn thuế: TN chịu thuế tạm tính (chưa trừ housing)
  const taxableBenefitsExHousing =
    emp.transportationAllowance +
    emp.attendanceBonus +
    emp.performanceBonus +
    emp.otTaxable +
    emp.otherTaxable;

  const taxableBaseForHousingCap =
    actualSalaryForWorkedDays + taxableBenefitsExHousing + emp.housingTaxable;

  const housingCap = cfg.housingNonTaxableRatio * taxableBaseForHousingCap;
  const housingNonTaxableEffective = Math.min(emp.housingNonTaxable, housingCap);
  const housingExcessTaxable = Math.max(0, emp.housingNonTaxable - housingCap);

  const totalNonTaxableBenefits = nonTaxableBeforeHousing + housingNonTaxableEffective;
  const totalTaxableBenefits =
    taxableBenefitsExHousing + emp.housingTaxable + housingExcessTaxable;

  // Nhóm 4 — Tổng thu nhập
  const grossIncome =
    actualSalaryForWorkedDays + totalNonTaxableBenefits + totalTaxableBenefits;
  const taxableIncomeGross = grossIncome - totalNonTaxableBenefits;

  // Nhóm 5 — Bảo hiểm
  const bhxhCap = cfg.baseSalary * cfg.bhxhCapMultiplier;
  const bhtnCap = cfg.regionMinWages[emp.region] * 20;
  const cappedBhxhSalary = Math.min(emp.insuranceSalary, bhxhCap);
  const cappedBhtnSalary = Math.min(emp.insuranceSalary, bhtnCap);

  const bhxhEmp = cappedBhxhSalary * cfg.bhxhEmpRate;
  const bhytEmp = cappedBhxhSalary * cfg.bhytEmpRate;
  const bhtnEmp = cappedBhtnSalary * cfg.bhtnEmpRate;
  const totalInsuranceEmp = bhxhEmp + bhytEmp + bhtnEmp;

  const bhxhEr = cappedBhxhSalary * cfg.bhxhErRate;
  const bhytEr = cappedBhxhSalary * cfg.bhytErRate;
  const bhtnEr = cappedBhtnSalary * cfg.bhtnErRate;
  const tnldEr = cappedBhxhSalary * cfg.tnldErRate;
  const totalInsuranceEr = bhxhEr + bhytEr + bhtnEr + tnldEr;

  // Nhóm 6 — Khấu trừ & PIT
  const personalDeduction = cfg.personalDeduction;
  const dependentDeduction = emp.dependents * cfg.dependentDeduction;

  const taxableIncomeAfterDeductions = Math.max(
    0,
    taxableIncomeGross - totalInsuranceEmp - personalDeduction - dependentDeduction,
  );

  const { pit, breakdown } = calcPIT(taxableIncomeAfterDeductions, cfg.taxBrackets);

  // Nhóm 7 — Thực lãnh
  const netAfterPIT = grossIncome - totalInsuranceEmp - pit;
  const netTakeHome = netAfterPIT + emp.additions - emp.otherDeductions;
  const totalCompanyExpenses = grossIncome + totalInsuranceEr;

  return {
    agreedGrossSalary: emp.agreedGrossSalary,
    contractSalary: emp.contractSalary,
    insuranceSalary: emp.insuranceSalary,

    totalWorkingDays: emp.totalWorkingDays,
    standardWorkingDays: standardDays,
    actualSalaryForWorkedDays,

    totalNonTaxableBenefits,
    totalTaxableBenefits,
    nonTaxableBreakdown: {
      lunch: lunchNonTaxable,
      uniform: emp.uniformAllowance,
      phone: emp.fixedPhoneAllowance,
      housing: housingNonTaxableEffective,
    },
    taxableBreakdown: {
      transportation: emp.transportationAllowance,
      attendance: emp.attendanceBonus,
      performance: emp.performanceBonus,
      housing: emp.housingTaxable + housingExcessTaxable,
      ot: emp.otTaxable,
      other: emp.otherTaxable + lunchTaxableExcess,
    },

    grossIncome,
    taxableIncomeGross,

    cappedBhxhSalary,
    cappedBhtnSalary,
    bhxhEmp, bhytEmp, bhtnEmp, totalInsuranceEmp,
    bhxhEr, bhytEr, bhtnEr, tnldEr, totalInsuranceEr,

    personalDeduction,
    dependentDeduction,
    taxableIncomeAfterDeductions,
    pit,
    pitBreakdown: breakdown,

    netAfterPIT,
    additions: emp.additions,
    otherDeductions: emp.otherDeductions,
    netTakeHome,
    totalCompanyExpenses,
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
