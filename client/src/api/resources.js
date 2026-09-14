import { api } from "./client";

function makeResource(path) {
  return {
    list: () => api.get(path),
    getOne: (id) => api.get(`${path}/${id}`),
    create: (body) => api.post(path, body),
    update: (id, body) => api.put(`${path}/${id}`, body),
    remove: (id) => api.del(`${path}/${id}`),
  };
}

export const suppliersApi = makeResource("/suppliers");
export const slaughterhousesApi = makeResource("/slaughterhouses");
export const dailyPricingApi = makeResource("/daily-pricing");
export const salesInvoicesApi = makeResource("/sales-invoices");
export const distributionTripsApi = makeResource("/distribution-trips");
export const vehiclesApi = makeResource("/vehicles");
export const driversApi = makeResource("/drivers");
export const expensesApi = makeResource("/expenses");

export const settingsApi = {
  get: () => api.get("/settings"),
  update: (body) => api.put("/settings", body),
};

export const usersApi = {
  list: () => api.get("/users"),
  create: (body) => api.post("/users", body),
  update: (id, body) => api.put(`/users/${id}`, body),
  resetPassword: (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword }),
  remove: (id) => api.del(`/users/${id}`),
};

export const dropdownOptionsApi = makeResource("/dropdown-options");

export const purchaseOrdersApi = makeResource("/purchase-orders");

export const roleDefaultsApi = {
  get: () => api.get("/role-defaults"),
  update: (body) => api.put("/role-defaults", body),
};

export const paymentsApi = makeResource("/payments");
export const loansApi = makeResource("/loans");

export const accountsSummaryApi = {
  get: () => api.get("/accounts-summary"),
};
