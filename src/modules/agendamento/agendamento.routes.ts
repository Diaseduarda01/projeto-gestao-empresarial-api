import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { agendamentoService, createAgendamentoSchema } from "./agendamento.service";

export const agendamentoRoutes = Router();
agendamentoRoutes.use(authMiddleware);

agendamentoRoutes.get("/", async (req, res) => {
  const data = typeof req.query.data === "string" ? req.query.data : undefined;
  res.json(await agendamentoService.list(data));
});

agendamentoRoutes.get("/:id", async (req, res) =>
  res.json(await agendamentoService.get(req.params.id))
);

agendamentoRoutes.post("/", validate(createAgendamentoSchema), async (req, res) =>
  res.status(201).json(await agendamentoService.create(req.body))
);

agendamentoRoutes.patch("/:id/cancelar", async (req, res) =>
  res.json(await agendamentoService.cancel(req.params.id))
);

agendamentoRoutes.patch("/:id/concluir", async (req, res) =>
  res.json(await agendamentoService.conclude(req.params.id))
);
