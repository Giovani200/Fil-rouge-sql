import { afterAll } from "vitest";
import { fermerPool } from "@/lib/db";

afterAll(fermerPool);
