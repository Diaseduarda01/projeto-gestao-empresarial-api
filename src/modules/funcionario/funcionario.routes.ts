import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { createFuncSchema, funcionarioService, updateFuncSchema } from "./funcionario.service";

const servicosSchema = z.object({ servicoIds: z.array(z.string().uuid()).min(1) });

export const funcionarioRoutes = Router();
funcionarioRoutes.use(authMiddleware);

funcionarioRoutes.get("/", async (_req, res) => res.json(await funcionarioService.list()));
funcionarioRoutes.get("/:id", async (req, res) => res.json(await funcionarioService.get(req.params.id)));

funcionarioRoutes.post("/", validate(createFuncSchema), async (req, res) =>
  res.status(201).json(await funcionarioService.create(req.body))
);
funcionarioRoutes.put("/:id", validate(updateFuncSchema), async (req, res) =>
  res.json(await funcionarioService.update(req.params.id, req.body))
);
funcionarioRoutes.delete("/:id", async (req, res) => {
  await funcionarioService.remove(req.params.id);
  res.status(204).send();
});

funcionarioRoutes.get("/:id/servicos", async (req, res) =>
  res.json(await funcionarioService.listServicos(req.params.id))
);
funcionarioRoutes.post("/:id/servicos", validate(servicosSchema), async (req, res) =>
  res.status(201).json(await funcionarioService.addServicos(req.params.id, req.body.servicoIds))
);
funcionarioRoutes.delete("/:id/servicos/:servicoId", async (req, res) => {
  await funcionarioService.removeServico(req.params.id, req.params.servicoId);
  res.status(204).send();
});
