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
export type EmployeeLevel = "Lãnh đạo" | "Quản lý" | "Chuyên viên" | "Khác";

export const EMPLOYEE_LEVELS: EmployeeLevel[] = ["Lãnh đạo", "Quản lý", "Chuyên viên", "Khác"];

export interface LevelAllowanceRow {
  transportation: number; // Xăng xe (VND/tháng)
  phone: number;          // Điện thoại (VND/tháng)
}

export interface PayrollConfig {
  // BH - NLĐ (10.5%)
  bhxhEmpRate: number;
  bhytEmpRate: number;
  bhtnEmpRate: number;
  // BH - NSDLĐ (21.5% + 0.5% TNLĐ)
  bhxhErRate: number;
  bhytErRate: number;
  bhtnErRate: number;
  tnldErRate: number;
  // Trần đóng BH
  baseSalary: number;
  bhxhCapMultiplier: number;
  regionMinWages: Record<Region, number>;
  // PIT
  personalDeduction: number;
  dependentDeduction: number;
  taxBrackets: { upTo: number | null; rate: number }[];
  // Công chuẩn & lunch
  standardWorkingDays: number;
  lunchAllowanceCap: number;
  lunchPerDay: number;
  housingNonTaxableRatio: number;
  defaultRegion: Region;

  // === Mới: Phụ cấp tự động theo cấp nhân sự ===
  levelAllowances: Record<EmployeeLevel, LevelAllowanceRow>;
  attendanceRatio: number; // Chuyên cần = % Agreed Gross
  housingRatio: number;    // Housing = % Agreed Gross

  // Cờ chịu thuế cho từng khoản phụ cấp tự động
  taxableFlags: {
    transportation: boolean;
    phone: boolean;
    attendance: boolean;
    housing: boolean;
    bonus: boolean;
  };
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
    { upTo: 10_000_000, rate: 0.05 },
    { upTo: 30_000_000, rate: 0.1 },
    { upTo: 60_000_000, rate: 0.2 },
    { upTo: 100_000_000, rate: 0.3 },
    { upTo: null, rate: 0.35 },
  ],
  standardWorkingDays: 22,
  lunchAllowanceCap: 730_000,
  lunchPerDay: 50_000,
  housingNonTaxableRatio: 0.15,
  defaultRegion: 1,

  levelAllowances: {
    "Lãnh đạo":   { transportation: 3_000_000, phone: 2_000_000 },
    "Quản lý":    { transportation: 2_000_000, phone: 1_000_000 },
    "Chuyên viên":{ transportation: 1_000_000, phone:   500_000 },
    "Khác":       { transportation:   500_000, phone:         0 },
  },
  attendanceRatio: 0.15,
  housingRatio: 0.10,

  taxableFlags: {
    transportation: true,
    phone: false,
    attendance: true,
    housing: false, // sẽ áp dụng cap 15% nếu không chịu thuế
    bonus: true,
  },
};

export interface EmployeeInput {
  // Nhóm 1
  id: string;
  employeeCode?: string;
  name: string;
  position?: string;
  department?: string;
  contractType?: ContractType;
  level?: EmployeeLevel; // mới — null/undefined = không tự động phụ cấp

  agreedGrossSalary: number;
  salaryAppliedRatio: number;
  contractSalary: number;
  insuranceSalary: number;

  // Nhóm 2
  totalWorkingDays: number;
  standardWorkingDays?: number;

  // Nhóm 3 — manual (vẫn giữ để override / thêm)
  lunchAllowance: number;
  uniformAllowance: number;
  fixedPhoneAllowance: number;   // = 0 nếu dùng auto theo level
  housingNonTaxable: number;     // = 0 nếu dùng auto
  transportationAllowance: number; // = 0 nếu dùng auto
  attendanceBonus: number;       // = 0 nếu dùng auto
  performanceBonus: number;      // bonus thủ công bổ sung
  housingTaxable: number;
  otTaxable: number;
  otherTaxable: number;

  // Nhóm 6
  dependents: number;
  // Nhóm 7
  additions: number;
  otherDeductions: number;

  region: Region;
}

export interface AutoAllowances {
  transportation: number;
  phone: number;
  attendance: number;
  housing: number;
  bonus: number;
  totalNonLunchAuto: number; // tổng các phụ cấp tự động (trừ lunch)
}

export interface PayrollResult {
  agreedGrossSalary: number;
  contractSalary: number;
  insuranceSalary: number;

  totalWorkingDays: number;
  standardWorkingDays: number;
  actualSalaryForWorkedDays: number;

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
    bonus: number;
  };
  autoAllowances: AutoAllowances;

  grossIncome: number;
  taxableIncomeGross: number;

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

  personalDeduction: number;
  dependentDeduction: number;
  taxableIncomeAfterDeductions: number;
  pit: number;
  pitBreakdown: { bracket: string; rate: number; amount: number; tax: number }[];

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
    level: "Chuyên viên",
    agreedGrossSalary: 0,
    salaryAppliedRatio: 1,
    contractSalary: 0,
    insuranceSalary: 0,
    totalWorkingDays: 22,
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

/** Tính các phụ cấp tự động theo cấp + Agreed Gross + ngày công.
 *  Bonus = AgreedGross * (công/công chuẩn) - (transport + phone + attendance + housing).
 *  Bonus có thể âm. Lunch KHÔNG nằm trong công thức bonus. */
export function computeAutoAllowances(emp: EmployeeInput, cfg: PayrollConfig): AutoAllowances {
  if (!emp.level) {
    return { transportation: 0, phone: 0, attendance: 0, housing: 0, bonus: 0, totalNonLunchAuto: 0 };
  }
  const row = cfg.levelAllowances[emp.level];
  const transportation = row?.transportation ?? 0;
  const phone = row?.phone ?? 0;
  const attendance = emp.agreedGrossSalary * cfg.attendanceRatio;
  const housing = emp.agreedGrossSalary * cfg.housingRatio;

  const standardDays = emp.standardWorkingDays && emp.standardWorkingDays > 0
    ? emp.standardWorkingDays
    : cfg.standardWorkingDays;
  const ratio = standardDays > 0 ? emp.totalWorkingDays / standardDays : 0;
  const targetGross = emp.agreedGrossSalary * ratio;

  const sumOthers = transportation + phone + attendance + housing;
  const bonus = targetGross - sumOthers; // có thể âm

  return {
    transportation,
    phone,
    attendance,
    housing,
    bonus,
    totalNonLunchAuto: transportation + phone + attendance + housing + bonus,
  };
}

export function calculatePayroll(emp: EmployeeInput, cfg: PayrollConfig = DEFAULT_CONFIG): PayrollResult {
  const standardDays = emp.standardWorkingDays && emp.standardWorkingDays > 0
    ? emp.standardWorkingDays
    : cfg.standardWorkingDays;

  // Nhóm 2 — Lương theo ngày công (vẫn dựa vào contract salary)
  const actualSalaryForWorkedDays = standardDays > 0
    ? (emp.contractSalary * emp.salaryAppliedRatio * emp.totalWorkingDays) / standardDays
    : 0;

  const auto = computeAutoAllowances(emp, cfg);
  const flags = cfg.taxableFlags;

  // Lunch: luôn không tính thuế
  const lunchNonTaxable = emp.lunchAllowance;

  // Tách auto theo cờ chịu thuế
  const autoTransportNT = flags.transportation ? 0 : auto.transportation;
  const autoTransportT  = flags.transportation ? auto.transportation : 0;
  const autoPhoneNT     = flags.phone ? 0 : auto.phone;
  const autoPhoneT      = flags.phone ? auto.phone : 0;
  const autoAttendanceT = flags.attendance ? auto.attendance : 0;
  const autoAttendanceNT= flags.attendance ? 0 : auto.attendance;
  const autoBonusT      = flags.bonus ? auto.bonus : 0;
  const autoBonusNT     = flags.bonus ? 0 : auto.bonus;

  // Housing auto: nếu cờ taxable bật => toàn bộ chịu thuế
  // Ngược lại: áp cap 15% như housingNonTaxable thủ công
  const housingAutoRequested = auto.housing;

  // Manual non-taxable (trước housing)
  const phoneManualNT = emp.fixedPhoneAllowance;
  const transportManualNT = 0; // transport thủ công = chịu thuế (giữ logic cũ)

  const nonTaxableBeforeHousing =
    lunchNonTaxable +
    emp.uniformAllowance +
    phoneManualNT +
    autoTransportNT + autoPhoneNT + autoAttendanceNT + autoBonusNT;

  // Taxable (chưa gồm housing)
  const taxableBenefitsExHousing =
    emp.transportationAllowance + transportManualNT + // transport thủ công
    emp.attendanceBonus +
    emp.performanceBonus +
    emp.otTaxable +
    emp.otherTaxable +
    autoTransportT + autoPhoneT + autoAttendanceT + autoBonusT;

  // Housing combo
  const housingNonTaxableManualReq = emp.housingNonTaxable + (flags.housing ? 0 : housingAutoRequested);
  const housingTaxableForced = emp.housingTaxable + (flags.housing ? housingAutoRequested : 0);

  const taxableBaseForHousingCap =
    actualSalaryForWorkedDays + taxableBenefitsExHousing + housingTaxableForced;
  const housingCap = cfg.housingNonTaxableRatio * taxableBaseForHousingCap;
  const housingNonTaxableEffective = Math.min(housingNonTaxableManualReq, housingCap);
  const housingExcessTaxable = Math.max(0, housingNonTaxableManualReq - housingCap);

  const totalNonTaxableBenefits = nonTaxableBeforeHousing + housingNonTaxableEffective;
  const totalTaxableBenefits =
    taxableBenefitsExHousing + housingTaxableForced + housingExcessTaxable;

  // Nhóm 4
  const grossIncome =
    actualSalaryForWorkedDays + totalNonTaxableBenefits + totalTaxableBenefits;
  const taxableIncomeGross = grossIncome - totalNonTaxableBenefits;

  // Nhóm 5
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

  // Nhóm 6
  const personalDeduction = cfg.personalDeduction;
  const dependentDeduction = emp.dependents * cfg.dependentDeduction;

  const taxableIncomeAfterDeductions = Math.max(
    0,
    taxableIncomeGross - totalInsuranceEmp - personalDeduction - dependentDeduction,
  );

  const { pit, breakdown } = calcPIT(taxableIncomeAfterDeductions, cfg.taxBrackets);

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
      phone: phoneManualNT + autoPhoneNT,
      housing: housingNonTaxableEffective,
    },
    taxableBreakdown: {
      transportation: emp.transportationAllowance + autoTransportT,
      attendance: emp.attendanceBonus + autoAttendanceT,
      performance: emp.performanceBonus,
      housing: housingTaxableForced + housingExcessTaxable,
      ot: emp.otTaxable,
      other: emp.otherTaxable,
      bonus: autoBonusT,
    },
    autoAllowances: auto,

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
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  return sign + new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.abs(rounded)) + " ₫";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(n));
}
