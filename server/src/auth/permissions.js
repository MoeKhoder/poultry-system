import { readJSON } from "../storage/store.js";

export const FEATURES = [
  { key: "suppliers", label: "الموردين" },
  { key: "slaughterhouses", label: "المسالخ" },
  { key: "dailyPricing", label: "إدارة الأسعار اليومية" },
  { key: "salesInvoices", label: "فواتير البيع" },
  { key: "distributionTrips", label: "رحلات التوزيع" },
  { key: "fleetManagement", label: "السيارات والسائقين" },
  { key: "expenses", label: "المصاريف" },
  { key: "accounts", label: "الحسابات" },
  { key: "reports", label: "التقارير" },
  { key: "documents", label: "المستندات" },
];

const LEVEL_RANK = { none: 0, view: 1, manage: 2 };

export const HARDCODED_ROLE_DEFAULTS = {
  IT: Object.fromEntries(FEATURES.map((f) => [f.key, "manage"])),
  Administrator: Object.fromEntries(FEATURES.map((f) => [f.key, "manage"])),
  Assistant: Object.fromEntries(FEATURES.map((f) => [f.key, "view"])),
};

export const CONFIGURABLE_ROLES = ["Administrator", "Assistant"];

export async function getRoleDefaults() {
  const stored = await readJSON("roleDefaults");
  const custom = stored[0] || {};
  const result = { IT: HARDCODED_ROLE_DEFAULTS.IT };
  for (const role of CONFIGURABLE_ROLES) {
    result[role] = { ...HARDCODED_ROLE_DEFAULTS[role], ...(custom[role] || {}) };
  }
  return result;
}

export async function effectivePermissions(user) {
  if (!user) return {};
  const roleDefaults = await getRoleDefaults();
  return { ...(roleDefaults[user.role] || {}), ...(user.permissions || {}) };
}

export async function hasAccess(user, feature, level) {
  if (!user) return false;
  if (user.role === "IT") return true;
  const permissions = await effectivePermissions(user);
  const granted = permissions[feature] || "none";
  return LEVEL_RANK[granted] >= LEVEL_RANK[level];
}

export function requireFeature(feature, level) {
  return async (req, res, next) => {
    const allowed = await hasAccess(req.user, feature, level);
    if (!allowed) {
      return res.status(403).json({ error: "forbidden", feature, level });
    }
    next();
  };
}

export function requireIT(req, res, next) {
  if (req.user?.role !== "IT") {
    return res.status(403).json({ error: "forbidden", reason: "IT role required" });
  }
  next();
}
