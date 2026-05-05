import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validate } from "../../middlewares/validate";
import { clienteController } from "./cliente.controller";
import { createClienteSchema, updateClienteSchema } from "./cliente.service";

export const clienteRoutes = Router();
clienteRoutes.use(authMiddleware);
clienteRoutes.get("/", clienteController.list);
clienteRoutes.get("/:id", clienteController.get);
clienteRoutes.post("/", validate(createClienteSchema), clienteController.create);
clienteRoutes.put("/:id", validate(updateClienteSchema), clienteController.update);
clienteRoutes.delete("/:id", clienteController.remove);
