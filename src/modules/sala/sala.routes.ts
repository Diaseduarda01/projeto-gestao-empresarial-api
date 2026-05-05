import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { createSalaSchema, salaService, updateSalaSchema } from "./sala.service";

export const salaRoutes = Router();
salaRoutes.use(authMiddleware);

salaRoutes.get("/", async (_req, res) => res.json(await salaService.list()));
salaRoutes.get("/:id", async (req, res) => res.json(await salaService.get(req.params.id)));
salaRoutes.post("/", validate(createSalaSchema), async (req, res) =>
  res.status(201).json(await salaService.create(req.body))
);
salaRoutes.put("/:id", validate(updateSalaSchema), async (req, res) =>
  res.json(await salaService.update(req.params.id, req.body))
);
salaRoutes.delete("/:id", async (req, res) => {
  await salaService.remove(req.params.id);
  res.status(204).send();
});
