import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export function buildHelmet() {
  const crossOrigin = env.allowedOrigins.length > 0;
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: crossOrigin ? ["'self'", ...env.allowedOrigins] : ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: crossOrigin ? "cross-origin" : "same-origin" },
  });
}

export function buildCors() {
  return cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (env.allowedOrigins.length === 0) return callback(null, true);
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("not_allowed_by_cors"));
    },
    credentials: true,
  });
}

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

export function noCacheForShell(req, res, next) {
  if (req.path === "/" || req.path === "/index.html") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  } else if (/\.[a-f0-9]{8,}\.(js|css)$/.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
}
