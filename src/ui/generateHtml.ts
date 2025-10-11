import { exec } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

interface PackageData {
    name: string;
    current: {
        version: string;
        publishDate: string;
    };
    next?: {
        version: string;
        publishDate: string;
    };
}

interface GenerateOptions {
    inputPath: string;
    outputPath: string;
}

export async function generateHtmlReport({
    inputPath,
    outputPath,
}: GenerateOptions) {
    try {
        const jsonData = readFileSync(inputPath, "utf-8");
        const packages: PackageData[] = JSON.parse(jsonData);

        const outputDir = dirname(outputPath);

        // Ensure output directory exists
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        // Copy the built Vite assets
        const viteDistPath = join(process.cwd(), "dist", "web");

        if (!existsSync(viteDistPath)) {
            throw new Error(
                "Vite build output not found. Run 'bun run build:web' first.",
            );
        }

        // Read the main HTML file and inject data
        const builtHtmlPath = join(viteDistPath, "index.html");
        const htmlContent = readFileSync(builtHtmlPath, "utf-8");

        // Replace the __PACKAGES_DATA__ placeholder with actual data
        const htmlWithData = htmlContent.replace(
            "__PACKAGES_DATA__",
            JSON.stringify(packages),
        );

        writeFileSync(outputPath, htmlWithData, "utf-8");

        console.log(`✅ HTML report generated: ${outputPath}`);
        console.log(`✅ Package data embedded in HTML`);

        // Open the HTML file in the default browser
        await openInBrowser(outputPath);
    } catch (error) {
        console.error("❌ Failed to generate HTML report:", error);
        throw error;
    }
}

async function openInBrowser(filePath: string) {
    try {
        const command =
            process.platform === "darwin"
                ? `open "${filePath}"`
                : process.platform === "win32"
                  ? `start "${filePath}"`
                  : `xdg-open "${filePath}"`;

        await execAsync(command);
        console.log(`🌐 Opening report in browser...`);
    } catch {
        console.warn(
            "⚠️  Could not automatically open browser. Please open the file manually.",
        );
    }
}
