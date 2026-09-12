export const suppliers = [
  { code: "S001", name: "مزرعة الأمل", region: "الرياض", contact: "عبدالله الأحمد", phone: "0501234567", totalPurchases: 145000, balance: 46500, status: "دائن" },
  { code: "S002", name: "شركة الخير للدواجن", region: "جدة", contact: "محمد العمري", phone: "0559876543", totalPurchases: 89000, balance: 3000, status: "دائن" },
  { code: "S003", name: "مزرعة الوادي", region: "الطائف", contact: "خالد الوادي", phone: "0534561234", totalPurchases: 212000, balance: 0, status: "مسدّد" },
  { code: "S004", name: "شركة الذهبي للدواجن", region: "الدمام", contact: "فيصل الذهبي", phone: "0512345678", totalPurchases: 67000, balance: 23000, status: "دائن" },
  { code: "S005", name: "مزرعة النخيل", region: "المدينة المنورة", contact: "سعد النخيل", phone: "0556789012", totalPurchases: 38000, balance: 0, status: "مسدّد" },
];

export const slaughterhouses = [
  { code: "SL001", name: "مسلخ النور", region: "الرياض", contact: "أحمد النور", phone: "0112345678", totalSales: 198000, capacityPerDay: 500, dueBalance: 53000, remainingBalance: 140000 },
  { code: "SL002", name: "مسلخ الفردوس", region: "جدة", contact: "سالم الفردوسي", phone: "0122345678", totalSales: 134000, capacityPerDay: 350, dueBalance: 0, remainingBalance: 134000 },
  { code: "SL003", name: "مسلخ السلام", region: "مكة", contact: "عمر السلامي", phone: "0125678901", totalSales: 89000, capacityPerDay: 400, dueBalance: 19000, remainingBalance: 70000 },
  { code: "SL004", name: "مسلخ الريان", region: "الدمام", contact: "ناصر الريان", phone: "0138901234", totalSales: 156000, capacityPerDay: 600, dueBalance: 0, remainingBalance: 156000 },
  { code: "SL005", name: "مسلخ الواحة", region: "المدينة المنورة", contact: "يوسف الواحة", phone: "0148765432", totalSales: 42000, capacityPerDay: 250, dueBalance: 10000, remainingBalance: 27000 },
];

export const dailyPrices = [
  { date: "2026-08-27", cagePrice: 120, fixedWeight: 8, kgPrice: 15.0, status: "نشط", label: "اليوم" },
  { date: "2026-08-26", cagePrice: 115, fixedWeight: 8, kgPrice: 14.38, status: "منتهي" },
  { date: "2026-08-25", cagePrice: 118, fixedWeight: 8, kgPrice: 14.75, status: "منتهي" },
  { date: "2026-08-24", cagePrice: 122, fixedWeight: 8, kgPrice: 15.25, status: "منتهي" },
  { date: "2026-08-23", cagePrice: 116, fixedWeight: 8, kgPrice: 14.5, status: "منتهي" },
];

export const salesInvoices = [
  { id: "SI-2026-1124", slaughterhouse: "مسلخ النور", date: "2026-08-27", cages: 120, weightKg: 960, discount: null, total: 14400, paymentStatus: "مدفوع" },
  { id: "SI-2026-1123", slaughterhouse: "مسلخ الفردوس", date: "2026-08-27", cages: 85, weightKg: 680, discount: "2%", total: 9996, paymentStatus: "جزئي" },
  { id: "SI-2026-1122", slaughterhouse: "مسلخ السلام", date: "2026-08-26", cages: 200, weightKg: 1600, discount: null, total: 24000, paymentStatus: "مدفوع" },
  { id: "SI-2026-1121", slaughterhouse: "مسلخ الريان", date: "2026-08-25", cages: 150, weightKg: 1200, discount: null, total: 17400, paymentStatus: "معلق" },
  { id: "SI-2026-1120", slaughterhouse: "مسلخ النور", date: "2026-08-24", cages: 90, weightKg: 720, discount: "3%", total: 10810, paymentStatus: "مدفوع" },
];

export const distributionTrips = [
  { id: "T-2848", date: "2026-08-27", supplier: "مزرعة الأمل", driver: "محمد السهلي", slaughterhouse: "مسلخ النور", cages: 120, weightKg: 960, transportCost: 430, status: "مكتملة" },
  { id: "T-2847", date: "2026-08-27", supplier: "شركة الخير للدواجن", driver: "أحمد العتيبي", slaughterhouse: "مسلخ الفردوس", cages: 85, weightKg: 680, transportCost: 360, status: "جارية" },
  { id: "T-2846", date: "2026-08-26", supplier: "مزرعة الوادي", driver: "خالد الزهراني", slaughterhouse: "مسلخ السلام", cages: 200, weightKg: 1600, transportCost: 310, status: "مكتملة" },
  { id: "T-2845", date: "2026-08-25", supplier: "شركة الذهبي للدواجن", driver: "فهد العسيري", slaughterhouse: "مسلخ الريان", cages: 150, weightKg: 1200, transportCost: 570, status: "مكتملة" },
  { id: "T-2844", date: "2026-08-24", supplier: "مزرعة الأمل", driver: "محمد السهلي", slaughterhouse: "مسلخ النور", cages: 95, weightKg: 760, transportCost: 360, status: "مكتملة" },
];

export const expenses = [
  { date: "2026-08-27", description: "وقود رحلة مزرعة الأمل ← مسلخ النور", vehicle: "أ ب ج 1234", driver: "محمد السهلي", amount: 280 },
  { date: "2026-08-27", description: "أجرة بيك أب لنقل الأقفاص الفارغة", vehicle: "—", driver: "—", amount: 150 },
  { date: "2026-08-27", description: "وقود رحلة مزرعة الوادي ← مسلخ الفردوس", vehicle: "د م و 5678", driver: "أحمد العتيبي", amount: 310 },
  { date: "2026-08-26", description: "تغيير زيت شاحنة سان", vehicle: "ي ك ل 3456", driver: "—", amount: 450 },
  { date: "2026-08-26", description: "وقود رحلة شركة الذهبي ← مسلخ الريان", vehicle: "ي ك ل 3456", driver: "فهد العسيري", amount: 390 },
  { date: "2026-08-25", description: "راتب سائق شهر أغسطس — محمد السهلي", vehicle: "—", driver: "—", amount: 3500 },
  { date: "2026-08-25", description: "رسوم تسجيل مركبة", vehicle: "ز ح ط 9012", driver: "—", amount: 200 },
];

export const supplierAccounts = [
  { name: "مزرعة الأمل", totalPurchases: 145000, paid: 98500, remaining: 46500, status: "جزئي" },
  { name: "شركة الخير للدواجن", totalPurchases: 89000, paid: 87000, remaining: 3000, status: "جزئي" },
  { name: "مزرعة الوادي", totalPurchases: 212000, paid: 212000, remaining: 0, status: "مدفوع" },
  { name: "شركة الذهبي للدواجن", totalPurchases: 67000, paid: 45000, remaining: 23000, status: "جزئي" },
];

export const slaughterhouseAccounts = [
  { name: "مسلخ النور", totalSales: 198000, paid: 145000, remaining: 53000, status: "جزئي" },
  { name: "مسلخ الفردوس", totalSales: 134000, paid: 134000, remaining: 0, status: "مدفوع" },
  { name: "مسلخ السلام", totalSales: 89000, paid: 70000, remaining: 19000, status: "جزئي" },
  { name: "مسلخ الريان", totalSales: 156000, paid: 156000, remaining: 0, status: "مدفوع" },
];

export const weeklyChart = [
  { week: "الأسبوع 1", sales: 420000, purchases: 300000 },
  { week: "الأسبوع 2", sales: 460000, purchases: 315000 },
  { week: "الأسبوع 3", sales: 440000, purchases: 305000 },
  { week: "الأسبوع 4", sales: 490000, purchases: 335000 },
  { week: "الأسبوع 5", sales: 470000, purchases: 320000 },
  { week: "الأسبوع 6", sales: 505000, purchases: 340000 },
];

export const dailyReport = {
  date: "27 أغسطس 2026",
  cages: 830,
  weightKg: 6640,
  purchases: 99600,
  sales: 132800,
  transportCost: 3840,
  netProfit: 29360,
  profitMargin: 22.1,
};

export const summary = {
  netProfit: 33200,
  netProfitMargin: 25,
  totalSales: 132800,
  todaySlaughterhouses: 5,
  totalPurchases: 99600,
  todaySuppliers: 7,
  totalWeightKg: 6640,
  avgWeightPerCage: 8,
};
