import { Request, Response } from "express";
import { clienteService } from "./cliente.service";

export const clienteController = {
  create: async (req: Request, res: Response) =>
    res.status(201).json(await clienteService.create(req.body)),
  list: async (_req: Request, res: Response) => res.json(await clienteService.list()),
  get: async (req: Request, res: Response) => res.json(await clienteService.get(req.params.id)),
  update: async (req: Request, res: Response) =>
    res.json(await clienteService.update(req.params.id, req.body)),
  remove: async (req: Request, res: Response) => {
    await clienteService.remove(req.params.id);
    res.status(204).send();
  },
};
