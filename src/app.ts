import "express-async-errors";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { swaggerDocument } from "./config/swagger";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(router);
app.use(errorHandler);
