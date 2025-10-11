import { basename } from "node:path";
import type { Package } from "../models/Package";
import { parseBunLock } from "./bun";
import { parsePackageLock } from "./npm";
import { parseYarnLock } from "./yarn";

export function parseDelegate(
    lockPath: string,
    lockFileContent: string,
): Package[] {
    try {
        const fileName = basename(lockPath);

        switch (fileName) {
            case "bun.lock":
                return parseBunLock(lockFileContent);
            case "package-lock.json":
                return parsePackageLock(lockFileContent);
            case "yarn.lock":
                return parseYarnLock(lockPath, lockFileContent);
            default:
                throw new Error(`Unsupported lock file format: ${fileName}`);
        }
    } catch (error) {
        console.error(`Error parsing lock file ${lockPath}:`, error);
        return [];
    }
}
