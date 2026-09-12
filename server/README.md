# Poultry System — Server

Node.js (ESM) + Express REST API, no ORM, flat JSON file persistence.

## Setup

```
npm install
cp .env.example .env
npm run seed
npm run dev
```

Seeded IT account: `admin` / `ChangeMe123!` — change this password immediately after first login.

## Structure

```
src/
  config/env.js            environment variables
  storage/store.js         readJSON / writeJSON / readModifyWrite / appendLog
  storage/seed.js          initial IT user + settings
  utils/sanitize.js        strips __proto__ / constructor / prototype, caps string length
  utils/hash.js            PBKDF2 (210k iterations) password hashing, token generation
  utils/audit.js           audit trail helper
  auth/sessions.js         opaque bearer token session store
  auth/authRoutes.js       login / logout / change-password
  auth/permissions.js      FEATURES registry, role defaults, hasAccess, requireFeature
  middleware/auth.js       requireAuth, requireAuthAny (query-string token for static files)
  middleware/security.js   helmet, CORS allowlist, rate limiters, cache policy
  crud/buildCrudRouter.js  generic 5-route REST factory
  modules/                 one file per resource
  files/                   member-photo validation, document upload/serving
```

## Adding a new resource

```js
import { buildCrudRouter } from "../crud/buildCrudRouter.js";

export default buildCrudRouter({
  file: "myCollection",
  moduleLabel: "myCollection",
  feature: "myFeatureKey",
  uniqueFields: ["someField"],
  protectedFields: ["serverComputedField"],
  beforeCreate: async (body, existingItems) => ({ ...body }),
  afterCreate: async (newItem, req) => {},
});
```

Register the feature key in `auth/permissions.js` FEATURES, and mount the router in `src/index.js` behind `requireAuth`.

## Structurally ungovernable resources

`users`, `settings`, and `audit-log` are intentionally **not** in the FEATURES registry. Each route file checks `req.user.role === "IT"` directly via `requireIT` — there is no permissions object that can grant access to these.

## Environment variables

See `.env.example`. `TRUST_PROXY` must only be enabled behind a real reverse proxy. `TLS_CERT_PATH`/`TLS_KEY_PATH` enable in-process HTTPS; leave blank to run plain HTTP behind an external proxy.
