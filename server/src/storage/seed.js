import crypto from "node:crypto";
import { readJSON, writeJSON } from "./store.js";
import { hashPassword } from "../utils/hash.js";

const TODAY = new Date("2026-09-07T00:00:00.000Z");
const WEEKS = 6;
const DAYS = WEEKS * 7;

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function record(fields) {
  return {
    ...fields,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy: "seed",
    _version: 1,
  };
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedUsers() {
  const existing = await readJSON("users");
  if (existing.length > 0) {
    console.log("users already seeded, skipping");
    return;
  }
  const { salt, hash } = hashPassword("ChangeMe123!");
  const itUser = {
    id: crypto.randomUUID(),
    username: "admin",
    role: "IT",
    permissions: {},
    active: true,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    createdBy: "seed",
    _version: 1,
  };
  await writeJSON("users", [itUser]);
  console.log("seeded IT user -> username: admin / password: ChangeMe123!");
}

async function seedSettings() {
  const existing = await readJSON("settings");
  if (existing.length > 0) return;
  await writeJSON("settings", [
    {
      companyName: "مؤسسة الأمل لتوزيع الدواجن",
      vatNumber: "300123456789012",
      commercialRegister: "1010234567",
      phone: "0112345678",
      city: "الرياض",
      address: "حي العليا، شارع التخصصي، الرياض",
      email: "info@alamal-poultry.com",
      currency: "$",
      weightUnit: "كغ",
      fixedCageWeight: 8,
      purchaseMarginPercent: 20,
      invoicePrefix: "SL",
      debtReminderDays: 7,
      invoiceFooterNote: "شكراً لتعاملكم معنا — مؤسسة الأمل لتوزيع الدواجن",
      alertSlaughterhouseDebtEnabled: true,
      alertSlaughterhouseDebtThreshold: 50000,
      alertDriverLicenseEnabled: true,
      alertDriverLicenseDays: 30,
      dailyEmailReportEnabled: false,
      alertMissingDailyPriceEnabled: true,
      _version: 1,
    },
  ]);
  console.log("seeded settings");
}

async function seedDropdownOptions(regionNames) {
  const existing = await readJSON("dropdownOptions");
  if (existing.length > 0) {
    console.log("dropdownOptions already seeded, skipping");
    return;
  }
  const lists = [
    record({ label: "المناطق", values: regionNames }),
    record({ label: "فئات المصاريف", values: ["وقود", "صيانة مركبات", "رواتب", "إيجار", "كهرباء وماء", "أخرى"] }),
    record({ label: "أنواع المركبات", values: ["شاحنة كبيرة", "شاحنة متوسطة", "بيك أب"] }),
    record({ label: "العملات", values: ["ر.س", "$", "د.إ", "ج.م", "د.ك"] }),
  ];
  await writeJSON("dropdownOptions", lists);
  console.log("seeded dropdownOptions");
}

async function seedSuppliers() {
  const existing = await readJSON("suppliers");
  if (existing.length > 0) {
    console.log("suppliers already seeded, skipping");
    return existing;
  }
  const suppliers = [
    record({ code: "S001", name: "مزرعة الأمل", region: "طرابلس", contact: "عبدالله الأحمد", phone: "81234567", totalPurchases: 145000, balance: 46500, status: "دائن" }),
    record({ code: "S002", name: "شركة الخير للدواجن", region: "بيروت", contact: "محمد العمري", phone: "70987654", totalPurchases: 89000, balance: 3000, status: "دائن" }),
    record({ code: "S003", name: "مزرعة الوادي", region: "زحلة", contact: "خالد الوادي", phone: "03456123", totalPurchases: 212000, balance: 0, status: "مسدّد" }),
    record({ code: "S004", name: "شركة الذهبي للدواجن", region: "صيدا", contact: "فيصل الذهبي", phone: "76123456", totalPurchases: 67000, balance: 23000, status: "دائن" }),
    record({ code: "S005", name: "مزرعة النخيل", region: "جونية", contact: "سعد النخيل", phone: "71678901", totalPurchases: 38000, balance: 0, status: "مسدّد" }),
  ];
  await writeJSON("suppliers", suppliers);
  console.log("seeded suppliers");
  return suppliers;
}

async function seedSlaughterhouses() {
  const existing = await readJSON("slaughterhouses");
  if (existing.length > 0) {
    console.log("slaughterhouses already seeded, skipping");
    return existing;
  }
  const slaughterhouses = [
    record({ code: "SL001", name: "مسلخ النور", region: "طرابلس", contact: "أحمد النور", phone: "81123456", totalSales: 198000, capacityPerDay: 500, dueBalance: 53000, remainingBalance: 140000 }),
    record({ code: "SL002", name: "مسلخ الفردوس", region: "بيروت", contact: "سالم الفردوسي", phone: "70223456", totalSales: 134000, capacityPerDay: 350, dueBalance: 0, remainingBalance: 134000 }),
    record({ code: "SL003", name: "مسلخ السلام", region: "صيدا", contact: "عمر السلامي", phone: "76567890", totalSales: 89000, capacityPerDay: 400, dueBalance: 19000, remainingBalance: 70000 }),
    record({ code: "SL004", name: "مسلخ الريان", region: "زحلة", contact: "ناصر الريان", phone: "03890123", totalSales: 156000, capacityPerDay: 600, dueBalance: 0, remainingBalance: 156000 }),
    record({ code: "SL005", name: "مسلخ الواحة", region: "جونية", contact: "يوسف الواحة", phone: "71876543", totalSales: 42000, capacityPerDay: 250, dueBalance: 10000, remainingBalance: 27000 }),
  ];
  await writeJSON("slaughterhouses", slaughterhouses);
  console.log("seeded slaughterhouses");
  return slaughterhouses;
}

async function seedDailyPrices() {
  const existing = await readJSON("dailyPrices");
  if (existing.length > 0) {
    console.log("dailyPrices already seeded, skipping");
    return existing;
  }
  const fixedWeight = 8;
  const marginPercent = 20;
  const prices = [];
  let kgPrice = 14.5;
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    kgPrice = Number(Math.max(13, Math.min(17, kgPrice + rand(-5, 5) / 10)).toFixed(2));
    const cagePrice = Number((kgPrice * fixedWeight * (1 - marginPercent / 100)).toFixed(2));
    const sellPrice = Number((kgPrice * 1.18).toFixed(2));
    prices.push(
      record({
        date: daysAgo(offset),
        cagePrice,
        fixedWeight,
        kgPrice,
        sellPrice,
        notes: null,
        status: offset === 0 ? "نشط" : "منتهي",
      }),
    );
  }
  await writeJSON("dailyPrices", prices);
  console.log(`seeded dailyPrices (${prices.length} days)`);
  return prices;
}

async function seedDistributionTrips(suppliers, slaughterhouses) {
  const existing = await readJSON("distributionTrips");
  if (existing.length > 0) {
    console.log("distributionTrips already seeded, skipping");
    return existing;
  }
  const drivers = ["محمد السهلي", "أحمد العتيبي", "خالد الزهراني", "فهد العسيري", "سعيد القحطاني", "ماجد الشهري"];
  const vehiclePlates = ["أ ب ج 1234", "د هـ و 5678", "ح ط ي 3456", "ك ل م 9012", "ن س ع 7654", "ص ق ر 2468"];
  const customers = [
    "سوبرماركت الأمل", "محل الطازج", "مطعم الذواقة", "بقالة النور", "سوبرماركت الشروق",
    "محل الوادي", "مطعم البيت", "بقالة السلام", "سوبرماركت المدينة", "محل الزهراء",
  ];
  const trips = [];
  let counter = 1;
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const tripsToday = rand(1, 3);
    for (let t = 0; t < tripsToday; t++) {
      const isLast = offset === 0 && t === tripsToday - 1;
      const dieselCost = rand(120, 400);
      const pickupCost = rand(60, 200);
      const stopsCount = rand(2, 5);
      const stops = [];
      for (let s = 0; s < stopsCount; s++) {
        const amountDue = rand(80, 400);
        stops.push({
          id: `stop-${counter}-${s}`,
          customerName: pick(customers, counter + s),
          amountDue,
          collected: !isLast && Math.random() > 0.25,
        });
      }
      trips.push(
        record({
          tripNumber: `T-${2800 + counter}`,
          date: daysAgo(offset),
          driver: pick(drivers, counter),
          vehicle: pick(vehiclePlates, counter),
          dieselCost,
          pickupCost,
          transportCost: dieselCost + pickupCost,
          stops,
          totalAmount: stops.reduce((sum, s) => sum + s.amountDue, 0),
          status: isLast ? "جارية" : "مكتملة",
        }),
      );
      counter++;
    }
  }
  await writeJSON("distributionTrips", trips);
  console.log(`seeded distributionTrips (${trips.length} trips)`);
  return trips;
}

async function seedSalesInvoices(dailyPrices, slaughterhouses) {
  const existing = await readJSON("salesInvoices");
  if (existing.length > 0) {
    console.log("salesInvoices already seeded, skipping");
    return existing;
  }
  const priceByDate = Object.fromEntries(dailyPrices.map((p) => [p.date, p.sellPrice || p.kgPrice * 1.18]));
  const invoices = [];
  let counter = 0;
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const invoicesToday = rand(1, 3);
    for (let i = 0; i < invoicesToday; i++) {
      const date = daysAgo(offset);
      const kgPrice = priceByDate[date] || 17;
      const weightKg = rand(60, 250) * 8;
      const cages = Math.round(weightKg / 8);
      const discount = counter % 5 === 0 ? "2%" : counter % 7 === 0 ? "3%" : null;
      let total = Math.round(weightKg * kgPrice);
      if (discount) total = Math.round(total * (1 - parseInt(discount) / 100));
      const paidRatio = counter % 5 === 0 ? 0 : counter % 3 === 0 ? 0.5 : 1;
      const paid = Math.round(total * paidRatio);
      invoices.push(
        record({
          invoiceNumber: `SL${String(counter + 1).padStart(3, "0")}`,
          slaughterhouse: pick(slaughterhouses, counter).name,
          date,
          cages,
          weightKg,
          kgPrice,
          discount,
          total,
          paid,
        }),
      );
      counter++;
    }
  }
  await writeJSON("salesInvoices", invoices);
  console.log(`seeded salesInvoices (${invoices.length} invoices)`);
  return invoices;
}

async function seedExpenses() {
  const existing = await readJSON("expenses");
  if (existing.length > 0) {
    console.log("expenses already seeded, skipping");
    return existing;
  }
  const staff = ["محمد خضر", "أحمد الغامدي", "سارة يوسف"];
  const templates = [
    { category: "وقود", description: "وقود رحلة توزيع", amount: [180, 320] },
    { category: "صيانة مركبات", description: "صيانة دورية للمركبة", amount: [300, 700] },
    { category: "إيجار", description: "إيجار المستودع", amount: [100, 250] },
    { category: "كهرباء وماء", description: "فاتورة كهرباء وماء", amount: [150, 300] },
    { category: "أخرى", description: "مصاريف متنوعة", amount: [50, 150] },
  ];
  const expenses = [];
  for (let offset = DAYS - 1; offset >= 0; offset -= 3) {
    const template = pick(templates, offset);
    expenses.push(
      record({
        date: daysAgo(offset),
        category: template.category,
        description: template.description,
        createdBy: pick(staff, offset),
        amount: rand(template.amount[0], template.amount[1]),
      }),
    );
  }
  for (let week = 0; week < WEEKS; week++) {
    expenses.push(
      record({
        date: daysAgo(week * 7 + 4),
        category: "رواتب",
        description: `رواتب أسبوع ${week + 1}`,
        createdBy: pick(staff, week),
        amount: rand(800, 1200),
      }),
    );
  }
  await writeJSON("expenses", expenses);
  console.log(`seeded expenses (${expenses.length} entries)`);
  return expenses;
}

async function seedPurchaseOrders(suppliers, dailyPrices) {
  const existing = await readJSON("purchaseOrders");
  if (existing.length > 0) {
    console.log("purchaseOrders already seeded, skipping");
    return existing;
  }
  const priceByDate = Object.fromEntries(dailyPrices.map((p) => [p.date, p.kgPrice]));
  const marginPercent = 20;
  const orders = [];
  let counter = 0;
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const ordersToday = rand(1, 3);
    for (let i = 0; i < ordersToday; i++) {
      const date = daysAgo(offset);
      const supplier = pick(suppliers, counter);
      const kgPrice = priceByDate[date] || 15;
      const buyPrice = Number((kgPrice * (1 - marginPercent / 100)).toFixed(2));
      const cages = rand(50, 220);
      const weightKg = cages * 8;
      const total = Math.round(weightKg * buyPrice);
      counter++;
      const paidRatio = counter % 5 === 0 ? 0 : counter % 3 === 0 ? 0.5 : 1;
      const paid = Math.round(total * paidRatio);
      orders.push(
        record({
          code: `S2026${String(counter).padStart(3, "0")}`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          date,
          cages,
          weightKg,
          kgPrice: buyPrice,
          total,
          paid,
        }),
      );
    }
  }
  await writeJSON("purchaseOrders", orders);
  console.log(`seeded purchaseOrders (${orders.length} orders)`);
  return orders;
}

const regionNames = ["طرابلس", "بيروت", "صيدا", "زحلة", "جونية", "البترون", "جبيل", "النبطية"];

const suppliers = await seedSuppliers();
const slaughterhouses = await seedSlaughterhouses();
const dailyPrices = await seedDailyPrices();
async function seedFleet(trips) {
  const existingVehicles = await readJSON("vehicles");
  const existingDrivers = await readJSON("drivers");
  if (existingVehicles.length > 0 && existingDrivers.length > 0) {
    console.log("fleet already seeded, skipping");
    return;
  }
  const vehicleTypes = ["شاحنة كبيرة", "شاحنة متوسطة", "بيك أب"];
  const vehicleModels = ["تويوتا هايلوكس 2023", "متسوبيشي 2021", "تويوتا هايلوكس 2020", "فورد رينجر 2022", "نيسان 2019", "إيسوزو 2022"];
  const distinctPlates = [...new Set(trips.map((t) => t.vehicle))];
  const distinctDrivers = [...new Set(trips.map((t) => t.driver))];

  const driverRecords = distinctDrivers.map((name, i) => {
    const trip = trips.find((t) => t.driver === name);
    return record({
      name,
      phone: `8${String(1000000 + i * 111111).slice(0, 7)}`,
      licenseNumber: String(1000000 + i * 37),
      licenseExpiry: `2027-0${(i % 9) + 1}-15`,
      assignedVehicleId: null,
      assignedVehiclePlate: trip?.vehicle || "",
      status: i === distinctDrivers.length - 1 ? "إجازة" : "متاح",
    });
  });

  const vehicleRecords = distinctPlates.map((plate, i) => {
    const tripsCount = trips.filter((t) => t.vehicle === plate).length;
    const driverName = trips.find((t) => t.vehicle === plate)?.driver || "";
    return record({
      plateNumber: plate,
      type: pick(vehicleTypes, i),
      model: pick(vehicleModels, i),
      capacity: [300, 200, 80, 350, 250, 150][i % 6],
      assignedDriverId: null,
      assignedDriverName: driverName,
      status: i === distinctPlates.length - 1 ? "صيانة" : "متاح",
      tripsCount,
    });
  });

  driverRecords.forEach((d) => {
    const vehicle = vehicleRecords.find((v) => v.plateNumber === d.assignedVehiclePlate);
    d.assignedVehicleId = vehicle ? vehicle.id : null;
  });
  vehicleRecords.forEach((v) => {
    const driver = driverRecords.find((d) => d.assignedVehiclePlate === v.plateNumber);
    v.assignedDriverId = driver ? driver.id : null;
  });

  await writeJSON("vehicles", vehicleRecords);
  await writeJSON("drivers", driverRecords);
  console.log(`seeded fleet (${vehicleRecords.length} vehicles, ${driverRecords.length} drivers)`);
}

const trips = await seedDistributionTrips(suppliers, slaughterhouses);
await seedFleet(trips);
await seedSalesInvoices(dailyPrices, slaughterhouses);
await seedExpenses();
await seedPurchaseOrders(suppliers, dailyPrices);
await seedDropdownOptions(regionNames);
await seedUsers();
await seedSettings();
console.log("seed complete");
