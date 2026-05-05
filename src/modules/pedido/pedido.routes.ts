import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { addServicosSchema, createPedidoSchema, pedidoService } from "./pedido.service";

export const pedidoRoutes = Router();
pedidoRoutes.use(authMiddleware);

pedidoRoutes.get("/", async (_req, res) => res.json(await pedidoService.list()));
pedidoRoutes.get("/:id", async (req, res) => res.json(await pedidoService.get(req.params.id)));

pedidoRoutes.post("/", validate(createPedidoSchema), async (req, res) =>
  res.status(201).json(await pedidoService.create(req.body))
);

pedidoRoutes.post("/:id/servicos", validate(addServicosSchema), async (req, res) =>
  res.json(await pedidoService.addServicos(req.params.id, req.body.servicoIds))
);

pedidoRoutes.patch("/:id/cancelar", async (req, res) =>
  res.json(await pedidoService.cancel(req.params.id))
);
