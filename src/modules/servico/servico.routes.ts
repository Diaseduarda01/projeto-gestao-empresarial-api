import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { createServicoSchema, servicoService, updateServicoSchema } from "./servico.service";

export const servicoRoutes = Router();
servicoRoutes.use(authMiddleware);

servicoRoutes.get("/", async (_req, res) => res.json(await servicoService.list()));
servicoRoutes.get("/:id", async (req, res) => res.json(await servicoService.get(req.params.id)));
servicoRoutes.post("/", validate(createServicoSchema), async (req, res) =>
  res.status(201).json(await servicoService.create(req.body))
);
servicoRoutes.put("/:id", validate(updateServicoSchema), async (req, res) =>
  res.json(await servicoService.update(req.params.id, req.body))
);
servicoRoutes.delete("/:id", async (req, res) => {
  await servicoService.remove(req.params.id);
  res.status(204).send();
});
