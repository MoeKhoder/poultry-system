import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { requireAuthAny } from "../middleware/auth.js";
import { requireFeature } from "../auth/permissions.js";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx"]);

if (!fs.existsSync(env.uploadsDir)) {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("extension_not_allowed"));
    }
    const randomName = crypto.randomBytes(24).toString("hex");
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

router.post("/", requireAuthAny, requireFeature("documents", "manage"), upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no_file" });
  }
  res.status(201).json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

router.get("/:filename", requireAuthAny, requireFeature("documents", "view"), (req, res) => {
  const safeName = path.basename(req.params.filename);
  const target = path.join(env.uploadsDir, safeName);
  if (!fs.existsSync(target)) {
    return res.status(404).json({ error: "not_found" });
  }
  res.sendFile(path.resolve(target));
});

export default router;
