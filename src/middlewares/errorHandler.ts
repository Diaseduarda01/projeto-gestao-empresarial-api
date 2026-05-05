import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./AppError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Dados inválidos", issues: err.issues });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Registro não encontrado" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Já existe um registro com este valor único" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ message: "Operação viola um relacionamento existente" });
    }
  }
  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
}
