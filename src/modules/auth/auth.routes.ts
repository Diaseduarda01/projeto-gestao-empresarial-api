import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Router } from "express";
import { prisma } from "../../database/prisma";
import { env } from "../../config/env";
import { AppError } from "../../middlewares/AppError";
import { validate } from "../../middlewares/validate";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), async (req, res) => {
  const { email, senha } = req.body as z.infer<typeof loginSchema>;
  const f = await prisma.funcionario.findUnique({ where: { email } });
  if (!f) throw new AppError(401, "Credenciais inválidas");
  const ok = await bcrypt.compare(senha, f.senha);
  if (!ok) throw new AppError(401, "Credenciais inválidas");
  const token = jwt.sign({}, env.JWT_SECRET, { subject: f.id, expiresIn: "1d" });
  res.json({ token, funcionario: { id: f.id, nome: f.nome, email: f.email } });
});
