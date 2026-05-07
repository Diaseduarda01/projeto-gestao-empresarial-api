import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  JWT_SECRET: process.env.JWT_SECRET!,
  DATABASE_URL: process.env.DATABASE_URL!,
};
