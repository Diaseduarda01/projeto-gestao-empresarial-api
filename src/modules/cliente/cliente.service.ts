import { z } from "zod";
import { AppError } from "../../middlewares/AppError";
import { clienteRepository } from "./cliente.repository";

export const createClienteSchema = z.object({
  nome: z.string().min(1).max(120),
  telefone: z.string().min(8).max(20),
  email: z.string().email(),
});
export const updateClienteSchema = createClienteSchema.partial();

export const clienteService = {
  create: (data: z.infer<typeof createClienteSchema>) => clienteRepository.create(data),
  list: () => clienteRepository.findAll(),
  get: async (id: string) => {
    const c = await clienteRepository.findById(id);
    if (!c) throw new AppError(404, "Cliente não encontrado");
    return c;
  },
  update: async (id: string, data: z.infer<typeof updateClienteSchema>) => {
    await clienteService.get(id);
    return clienteRepository.update(id, data);
  },
  remove: async (id: string) => {
    await clienteService.get(id);
    return clienteRepository.delete(id);
  },
};
