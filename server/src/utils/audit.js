import { appendLog } from "../storage/store.js";

export async function recordAudit({ req, action, module, recordId, oldValue, newValue, result }) {
  await appendLog({
    username: req.user?.username || "anonymous",
    role: req.user?.role || "none",
    action,
    module,
    recordId: recordId ?? null,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    result,
    ip: req.ip,
  });
}
