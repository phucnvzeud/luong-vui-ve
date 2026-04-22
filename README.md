**PayrollVN**

Tài liệu kỹ thuật & nghiệp vụ

*Công cụ tính lương Net/Gross cho doanh nghiệp Việt Nam (TP.HCM, 2024)*

Phiên bản: 1.0 · Cập nhật: 2026-04-22

Bao gồm: Mục đích sản phẩm · Kiến trúc · Công thức nghiệp vụ · Hướng dẫn
sử dụng · Cấu trúc dữ liệu · Vận hành & mở rộng

**Mục lục**

**1. Tổng quan sản phẩm**

> 1.1. Mục tiêu
>
> 1.2. Đối tượng sử dụng
>
> 1.3. Phạm vi & giới hạn

**2. Kiến trúc & công nghệ**

> 2.1. Stack
>
> 2.2. Cấu trúc thư mục
>
> 2.3. Nguyên tắc thiết kế

**3. Mô hình dữ liệu**

> 3.1. PayrollConfig — cấu hình công thức
>
> 3.2. EmployeeInput — đầu vào 1 nhân viên

**4. Công thức nghiệp vụ**

> 4.1. Nhóm 1 — Cơ sở lương
>
> 4.2. Nhóm 2 — Lương theo ngày công
>
> 4.3. Nhóm 3 — Phụ cấp tự động (theo cấp nhân sự)
>
> 4.4. Cờ chịu thuế (taxableFlags)
>
> 4.5. Nhóm 4 — Tổng thu nhập
>
> 4.6. Nhóm 5 — Bảo hiểm bắt buộc
>
> 4.7. Nhóm 6 — Thuế TNCN lũy tiến
>
> 4.8. Nhóm 7 — Thực lãnh & tổng chi phí công ty

**5. Hướng dẫn sử dụng**

> 5.1. Khu vực Profile
>
> 5.2. Tab “Tính 1 nhân viên”
>
> 5.3. Tab “Bảng lương”
>
> 5.4. Tab “Tùy chỉnh công thức”

**6. Vận hành & mở rộng**

> 6.1. Lưu trữ dữ liệu
>
> 6.2. Quy ước code
>
> 6.3. Cách thêm bậc thuế / phụ cấp mới
>
> 6.4. Roadmap gợi ý
>
> 6.5. Pháp lý & nguồn tham chiếu

**7. Phụ lục**

> 7.1. Bảng phụ cấp theo cấp nhân sự
>
> 7.2. Ví dụ minh họa
>
> 7.3. Câu hỏi thường gặp

**1. Tổng quan sản phẩm**

PayrollVN là công cụ tính lương dành cho doanh nghiệp Việt Nam, tập
trung quy định 2024 và mặt bằng TP.HCM. Ứng dụng hỗ trợ tính cả chiều
Net→Gross (gián tiếp qua nhập liệu Gross) và Gross→Net, với đầy đủ các
cấu phần: BHXH/BHYT/BHTN, thuế TNCN lũy tiến, phụ cấp tự động theo cấp
nhân sự và bảng lương hàng loạt có export Excel.

**1.1. Mục tiêu**

- Tự động hóa tính lương theo quy định BHXH 2024 + Thông tư
  111/2013/TT-BTC.

- Cho phép HR/Kế toán tùy chỉnh công thức (tỷ lệ, mức trần, bậc thuế) mà
  không cần lập trình.

- Hỗ trợ profile cấu hình theo nhiều công ty / chính sách khác nhau.

- Tính 1 nhân viên (chi tiết) hoặc bảng lương nhiều nhân viên (xuất
  Excel).

**1.2. Đối tượng sử dụng**

- HR / C&B chuẩn bị bảng lương tháng.

- Kế toán đối chiếu chi phí nhân sự, BHXH, thuế TNCN.

- Quản lý/CEO ước lượng tổng chi phí nhân sự (Total Employer Cost).

**1.3. Phạm vi & giới hạn**

- Áp dụng quy định 2024: lương cơ sở 2.340.000 ₫ (từ 01/07/2024), trần
  BHXH/BHYT = 20× lương cơ sở, trần BHTN = 20× lương tối thiểu vùng.

- Bậc thuế TNCN theo Thông tư 111/2013/TT-BTC (5/10/15/20/25/30/35%;
  trong app gộp gọn 5/10/20/30/35% theo cấu hình mặc định — có thể chỉnh
  thành 7 bậc đầy đủ qua Config).

- Không bao gồm các trường hợp đặc biệt: hợp đồng \< 3 tháng khấu trừ
  10% tại nguồn, người nước ngoài cư trú/không cư trú khác công thức,
  phụ cấp đặc thù ngành.

- Là công cụ tham khảo — luôn đối chiếu lại với cơ quan BHXH địa phương
  và quy định mới nhất.

**2. Kiến trúc & công nghệ**

**2.1. Stack**

| **Lớp** | **Công nghệ**                 | **Ghi chú**                    |
|---------|-------------------------------|--------------------------------|
| UI      | React 18 + TypeScript 5       | Component-based, strict typing |
| Build   | Vite + TanStack Start         | Dev server cổng 8080           |
| Routing | TanStack Router (file-based)  | src/routes/\*                  |
| Styling | Tailwind CSS v4 + shadcn/ui   | Tokens trong src/styles.css    |
| State   | React useState + localStorage | Không có backend               |
| Excel   | SheetJS (xlsx)                | Export bảng lương              |
| Icons   | lucide-react                  |                                |
| Toast   | sonner                        |                                |

**2.2. Cấu trúc thư mục**

src/

├─ routes/

│ ├─ \_\_root.tsx \# Root layout (TanStack Router)

│ └─ index.tsx \# Trang chính: header + tabs + footer

├─ components/

│ ├─ payroll/

│ │ ├─ SingleCalculator.tsx \# Tính 1 nhân viên (form + kết quả)

│ │ ├─ BulkPayroll.tsx \# Bảng lương nhiều người + export Excel

│ │ ├─ ConfigPanel.tsx \# Tùy chỉnh công thức

│ │ └─ ProfileBar.tsx \# Quản lý profile cấu hình

│ └─ ui/ \# shadcn/ui (button, input, tabs, ...)

├─ lib/

│ ├─ payroll.ts \# Engine tính lương (PURE functions)

│ ├─ profiles.ts \# CRUD profile + merge config

│ └─ utils.ts \# cn() helper

├─ styles.css \# Tailwind v4 + design tokens

└─ router.tsx \# Khởi tạo router

**2.3. Nguyên tắc thiết kế**

- Engine tính lương (src/lib/payroll.ts) là pure function — không phụ
  thuộc UI, dễ test.

- Toàn bộ cấu hình tách khỏi logic: thay đổi tỷ lệ/bậc thuế không cần
  sửa code.

- State persist bằng localStorage (4 key: profiles, lastProfile,
  savedEmployees, config legacy).

- Không có backend → dữ liệu nằm trên trình duyệt người dùng (riêng tư,
  nhưng không đồng bộ máy khác).

**3. Mô hình dữ liệu**

**3.1. PayrollConfig — cấu hình công thức**

Mỗi profile lưu một PayrollConfig. Trường mặc định lấy từ DEFAULT_CONFIG
(src/lib/payroll.ts).

| **Trường** | **Mặc định** | **Ý nghĩa** |
|----|----|----|
| bhxhEmpRate / bhytEmpRate / bhtnEmpRate | 8% / 1.5% / 1% | Tỷ lệ BHXH-BHYT-BHTN nhân viên đóng |
| bhxhErRate / bhytErRate / bhtnErRate | 17.5% / 3% / 1% | Tỷ lệ doanh nghiệp đóng |
| tnldErRate | 0.5% | Tai nạn LĐ - Bệnh nghề nghiệp (DN đóng) |
| baseSalary | 2.340.000 ₫ | Lương cơ sở (từ 01/07/2024) |
| bhxhCapMultiplier | 20 | Trần BHXH/BHYT = baseSalary × hệ số |
| regionMinWages\[1..4\] | 4.96 / 4.41 / 3.86 / 3.45 triệu | Lương tối thiểu vùng (cho trần BHTN) |
| personalDeduction | 11.000.000 ₫ | Giảm trừ gia cảnh bản thân/tháng |
| dependentDeduction | 4.400.000 ₫ | Giảm trừ mỗi người phụ thuộc/tháng |
| taxBrackets\[\] | 5/10/20/30/35% | Các bậc thuế TNCN lũy tiến |
| standardWorkingDays | 22 | Ngày công chuẩn của tháng |
| lunchPerDay | 50.000 ₫ | Tiền ăn ca / ngày |
| lunchAllowanceCap | 730.000 ₫ | Trần ăn ca miễn thuế (tham khảo) |
| housingNonTaxableRatio | 15% | Trần housing miễn thuế = 15% (lương + thu nhập chịu thuế) |
| levelAllowances\[level\] | Theo cấp | Mức Xăng xe & Điện thoại theo cấp nhân sự |
| attendanceRatio | 15% | Chuyên cần = % Contracted Salary |
| housingRatio | 10% | Housing = % Contracted Salary |
| taxableFlags | {...} | Cờ chịu thuế cho từng phụ cấp tự động |

**3.2. EmployeeInput — đầu vào 1 nhân viên**

| **Nhóm** | **Trường** | **Ý nghĩa** |
|----|----|----|
| 1\. Hồ sơ | id, employeeCode, name, position, department, contractType, level, region | Thông tin nhận dạng & vùng đóng BH |
| 1\. Lương | agreedGrossSalary | Lương Gross thỏa thuận (mục tiêu để tính Bonus) |
| 1\. Lương | salaryAppliedRatio | Hệ số áp dụng (ví dụ thử việc 85% = 0.85) |
| 1\. Lương | contractSalary | Lương ghi trên HĐLĐ — cơ sở tính theo ngày công, Chuyên cần, Housing |
| 1\. Lương | insuranceSalary | Lương đóng BH (thường = contract, nhưng có thể khác) |
| 2\. Công | totalWorkingDays, standardWorkingDays? | Ngày làm thực tế / ngày chuẩn (override) |
| 3\. Phụ cấp thủ công | lunchAllowance, uniformAllowance, fixedPhoneAllowance, housingNonTaxable, transportationAllowance, attendanceBonus, performanceBonus, housingTaxable, otTaxable, otherTaxable | Các khoản nhập tay (cộng thêm hoặc thay thế phần auto) |
| 6\. Thuế | dependents | Số người phụ thuộc (giảm trừ 4.4 triệu/người) |
| 7\. Khác | additions, otherDeductions | Cộng/trừ cuối kỳ (thưởng tay, tạm ứng…) |

**4. Công thức nghiệp vụ**

Toàn bộ công thức nằm trong calculatePayroll() và
computeAutoAllowances() ở src/lib/payroll.ts. Phần này mô tả thứ tự 7
nhóm và các công thức quan trọng.

**4.1. Nhóm 1 — Cơ sở lương**

- **agreedGrossSalary**: Lương Gross thỏa thuận (mục tiêu).

- **contractSalary**: Lương HĐLĐ — dùng để tính lương theo ngày công,
  Chuyên cần và Housing.

- **insuranceSalary**: Lương đóng BH (thường ≤ contract, có thể bị áp
  trần).

**4.2. Nhóm 2 — Lương theo ngày công**

actualSalaryForWorkedDays

= contractSalary × salaryAppliedRatio × totalWorkingDays /
standardWorkingDays

**4.3. Nhóm 3 — Phụ cấp tự động (theo cấp nhân sự)**

Khi nhân viên có level (Lãnh đạo / Quản lý / Chuyên viên / Khác), hệ
thống tự sinh các khoản:

Xăng xe = levelAllowances\[level\].transportation

Điện thoại = levelAllowances\[level\].phone

Chuyên cần = contractSalary × attendanceRatio // mặc định 15%

Housing = contractSalary × housingRatio // mặc định 10%

targetGross = agreedGrossSalary × (totalWorkingDays /
standardWorkingDays)

Bonus = targetGross − (Xăng + ĐT + Chuyên cần + Housing)

// Bonus có thể âm; Lunch KHÔNG nằm trong công thức Bonus

*Lưu ý quan trọng (cập nhật phiên bản này): Chuyên cần và Housing tính
trên Contracted Salary (lương HĐ), KHÔNG phải Agreed Gross. Mục tiêu: cố
định khoản phụ cấp theo HĐLĐ, không bị nở ra theo Gross thỏa thuận.*

**4.4. Cờ chịu thuế (taxableFlags)**

| **Khoản** | **taxable=true** | **taxable=false** |
|----|----|----|
| Xăng xe (auto) | Cộng vào thu nhập chịu thuế | Miễn thuế hoàn toàn |
| Điện thoại (auto) | Cộng vào thu nhập chịu thuế | Miễn thuế hoàn toàn |
| Chuyên cần | Cộng vào thu nhập chịu thuế | Miễn thuế hoàn toàn |
| Housing | Toàn bộ chịu thuế | Áp trần 15% (housingNonTaxableRatio); phần vượt → chịu thuế |
| Bonus (chênh lệch) | Cộng vào thu nhập chịu thuế | Miễn thuế (hiếm dùng) |

**4.5. Nhóm 4 — Tổng thu nhập**

grossIncome

= actualSalaryForWorkedDays

\+ totalNonTaxableBenefits

\+ totalTaxableBenefits

taxableIncomeGross = grossIncome − totalNonTaxableBenefits

Trong đó housing áp dụng trần 15%:

housingCap = 15% × (actualSalary + taxableBenefits trừ housing +
housingTaxableForced)

housingNonTaxableEffective = min(housingRequested, housingCap)

housingExcess = max(0, housingRequested − housingCap) // chuyển sang
chịu thuế

**4.6. Nhóm 5 — Bảo hiểm bắt buộc**

bhxhCap = baseSalary × bhxhCapMultiplier // 2.34tr × 20 = 46.8tr

bhtnCap = regionMinWages\[region\] × 20

cappedBhxhSalary = min(insuranceSalary, bhxhCap)

cappedBhtnSalary = min(insuranceSalary, bhtnCap)

// Nhân viên đóng (10.5%)

bhxhEmp = cappedBhxhSalary × 8%

bhytEmp = cappedBhxhSalary × 1.5%

bhtnEmp = cappedBhtnSalary × 1%

// Doanh nghiệp đóng (~22%)

bhxhEr = cappedBhxhSalary × 17.5%

bhytEr = cappedBhxhSalary × 3%

bhtnEr = cappedBhtnSalary × 1%

tnldEr = cappedBhxhSalary × 0.5% // Tai nạn LĐ - BNN

**4.7. Nhóm 6 — Thuế TNCN lũy tiến**

taxableIncomeAfterDeductions

= max(0, taxableIncomeGross − totalInsuranceEmp

− personalDeduction − dependents × dependentDeduction)

PIT = Σ (slice_i × rate_i) // theo bậc lũy tiến

| **Bậc** | **Thu nhập tính thuế / tháng**      | **Thuế suất** |
|---------|-------------------------------------|---------------|
| 1       | Đến 5 triệu (gộp 0–10tr ở mặc định) | 5%            |
| 2       | 10 – 18 triệu (gộp 10–30tr)         | 10%           |
| 3       | 30 – 60 triệu                       | 20%           |
| 4       | 60 – 100 triệu                      | 30%           |
| 5       | Trên 100 triệu                      | 35%           |

Mặc định trong app gộp 5 bậc (đơn giản hóa). Người dùng có thể chỉnh
sang 7 bậc đầy đủ trong tab “Tùy chỉnh công thức”.

**4.8. Nhóm 7 — Thực lãnh & tổng chi phí công ty**

netAfterPIT = grossIncome − totalInsuranceEmp − PIT

netTakeHome = netAfterPIT + additions − otherDeductions

totalCompanyExpenses = grossIncome + totalInsuranceEr

**5. Hướng dẫn sử dụng**

**5.1. Khu vực Profile (đầu trang)**

- Chọn profile đang dùng từ dropdown — mọi thay đổi cấu hình sẽ tự lưu
  vào profile này.

- “Tạo mới” để thêm profile (ví dụ: chính sách công ty A, công ty B).

- “Đổi tên” / “Xóa” để quản lý.

- Profile được lưu trong localStorage — không đồng bộ giữa các máy.

**5.2. Tab “Tính 1 nhân viên”**

- Nhập thông tin nhân viên (mã, tên, cấp, vùng, lương HĐ, lương đóng BH,
  ngày công, người phụ thuộc).

- Các phụ cấp tự động (Xăng/ĐT/Chuyên cần/Housing/Bonus) hiển thị ở khối
  kết quả; có thể tinh chỉnh bằng các trường thủ công.

- Nút “Lưu hồ sơ” lưu toàn bộ input nhân viên này vào localStorage để
  dùng lại.

- Kết quả gồm: lương theo ngày công, tổng thu nhập, BH, thuế TNCN (kèm
  breakdown theo bậc), Net thực lãnh và Tổng chi phí công ty.

**5.3. Tab “Bảng lương”**

- Nhập từng dòng nhân viên (hoặc dùng dữ liệu mẫu).

- Cột “Ngày công” đổi sẽ tự cập nhật tiền ăn ca = ngày × lunchPerDay.

- Nhấn “Xuất Excel” để tải file .xlsx với đầy đủ các cột tính toán (dùng
  cho đối chiếu hoặc gửi kế toán).

**5.4. Tab “Tùy chỉnh công thức”**

- Chỉnh tỷ lệ BHXH/BHYT/BHTN cho cả 2 phía.

- Đổi mức trần đóng BH, lương tối thiểu vùng.

- Sửa giảm trừ gia cảnh, các bậc thuế.

- Cấu hình Xăng/ĐT theo cấp nhân sự, tỷ lệ Chuyên cần & Housing.

- Bật/tắt cờ chịu thuế cho từng khoản phụ cấp.

- Nút “Mặc định 2024” khôi phục về cấu hình gốc.

**6. Vận hành & mở rộng**

**6.1. Lưu trữ dữ liệu**

| **Khóa localStorage** | **Dữ liệu** | **Quản lý ở** |
|----|----|----|
| payrollvn:configProfiles:v1 | Danh sách profile cấu hình | src/lib/profiles.ts |
| payrollvn:lastProfile:v1 | ID profile đang chọn | src/lib/profiles.ts |
| payrollvn:savedEmployees:v1 | Hồ sơ nhân viên đã lưu | SingleCalculator.tsx |
| payrollvn:config:v1 | (Legacy) cấu hình cũ trước khi có profile | ConfigPanel.tsx — chỉ đọc khi migrate |

**6.2. Quy ước code**

- Engine (lib/payroll.ts) phải pure: không gọi localStorage/DOM.

- Components dùng shadcn/ui có sẵn trong src/components/ui — không tự
  viết button/input.

- Mọi màu/khoảng cách dùng Tailwind tokens trong styles.css; không
  hardcode HEX trong component.

- State quản lý ở trang gốc (routes/index.tsx); panel con nhận props.

**6.3. Cách thêm một bậc thuế hoặc khoản phụ cấp mới**

- Mở rộng PayrollConfig (src/lib/payroll.ts) với trường mới + giá trị
  mặc định.

- Cập nhật mergeConfig (src/lib/profiles.ts) để bù field thiếu khi đọc
  profile cũ.

- Cập nhật calculatePayroll để cộng/khấu trừ khoản mới đúng nhóm
  (taxable / non-taxable).

- Bổ sung input ở ConfigPanel.tsx (cho cấu hình) hoặc
  SingleCalculator/BulkPayroll (cho input nhân viên).

- Cập nhật export Excel ở BulkPayroll nếu là cột mới.

**6.4. Roadmap gợi ý**

- Net→Gross solver (giải ngược lương Gross từ Net mong muốn).

- Lưu cloud (Lovable Cloud) để dùng trên nhiều máy.

- Phân quyền: HR vs Kế toán (chỉ xem).

- Báo cáo so sánh nhiều tháng / nhiều profile.

- Nhập file Excel nhân viên (import 2 chiều).

**6.5. Pháp lý & nguồn tham chiếu**

- Luật Bảo hiểm xã hội 2014 và các văn bản hướng dẫn (NĐ 58/2020/NĐ-CP,
  NĐ 38/2022/NĐ-CP).

- Thông tư 111/2013/TT-BTC — hướng dẫn thuế TNCN.

- Nghị quyết 954/2020/UBTVQH14 — mức giảm trừ gia cảnh.

- Nghị định 24/2023/NĐ-CP — lương cơ sở 1.800.000 ₫ (tham khảo lịch sử);
  2.340.000 ₫ áp dụng từ 01/07/2024.

- Nghị định 74/2024/NĐ-CP — lương tối thiểu vùng 2024.

**7. Phụ lục**

**7.1. Bảng phụ cấp theo cấp nhân sự (mặc định)**

| **Cấp**     | **Xăng xe (₫/tháng)** | **Điện thoại (₫/tháng)** |
|-------------|-----------------------|--------------------------|
| Lãnh đạo    | 3.000.000             | 2.000.000                |
| Quản lý     | 2.000.000             | 1.000.000                |
| Chuyên viên | 1.000.000             | 500.000                  |
| Khác        | 500.000               | 0                        |

**7.2. Ví dụ minh họa**

Nhân viên cấp “Quản lý”, agreedGrossSalary = 30.000.000, contractSalary
= 20.000.000, làm 22/22 ngày, mức Chuyên cần 15% và Housing 10% (theo
Contracted Salary):

Xăng xe = 2.000.000

Điện thoại = 1.000.000

Chuyên cần = 20.000.000 × 15% = 3.000.000

Housing = 20.000.000 × 10% = 2.000.000

targetGross = 30.000.000 × 22/22 = 30.000.000

Bonus = 30.000.000 − (2.000.000 + 1.000.000 + 3.000.000 + 2.000.000)

= 22.000.000

So với phiên bản trước (tính trên Agreed Gross 30tr): Chuyên cần đã giảm
từ 4.5tr → 3.0tr, Housing từ 3.0tr → 2.0tr; phần chênh dồn vào Bonus,
giúp khoản phụ cấp gắn với HĐLĐ ổn định hơn.

**7.3. Câu hỏi thường gặp**

- **Vì sao Bonus có thể âm?** Khi tổng (Xăng + ĐT + Chuyên cần +
  Housing) lớn hơn targetGross (do nghỉ nhiều), Bonus sẽ âm để Gross
  thực nhận khớp với mục tiêu theo ngày công.

- **Vì sao Housing chỉ miễn thuế tối đa 15%?** Theo TT 111/2013, tiền
  nhà do người sử dụng lao động trả thay được miễn thuế phần không vượt
  quá 15% tổng thu nhập chịu thuế (chưa gồm tiền nhà).

- **Vì sao có cả contractSalary và insuranceSalary?** Một số doanh
  nghiệp đăng ký mức đóng BH thấp hơn lương HĐLĐ (vẫn ≥ tối thiểu vùng +
  7% nếu là vị trí cần đào tạo). Tách 2 trường giúp tính chính xác cả
  lương ngày công lẫn BH.

- **Tôi muốn áp dụng cho công ty ở Hà Nội (vùng 1)?** Trong từng nhân
  viên, đổi region = 1 (mặc định). Vùng chỉ ảnh hưởng trần BHTN.
