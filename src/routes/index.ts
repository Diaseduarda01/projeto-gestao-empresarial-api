import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { clienteRoutes } from "../modules/cliente/cliente.routes";
import { funcionarioRoutes } from "../modules/funcionario/funcionario.routes";
import { servicoRoutes } from "../modules/servico/servico.routes";
import { salaRoutes } from "../modules/sala/sala.routes";
import { pedidoRoutes } from "../modules/pedido/pedido.routes";
import { agendamentoRoutes } from "../modules/agendamento/agendamento.routes";

export const router = Router();
router.use("/auth", authRoutes);
router.use("/clientes", clienteRoutes);
router.use("/funcionarios", funcionarioRoutes);
router.use("/servicos", servicoRoutes);
router.use("/salas", salaRoutes);
router.use("/pedidos", pedidoRoutes);
router.use("/agendamentos", agendamentoRoutes);
