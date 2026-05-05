import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";

export async function setup() {
  config({ path: resolve(process.cwd(), ".env.test"), override: true });
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
