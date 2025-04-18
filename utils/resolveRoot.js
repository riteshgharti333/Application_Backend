import path from "path";
import { fileURLToPath } from "url";

export const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
