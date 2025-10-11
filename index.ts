#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { generateHtmlReport } from "./src/ui/generateHtml";
import { analyzeRepo } from "./src/util/analayzeRepo";
import { analyzePackageFile } from "./src/util/analyzePackageFile";
import { autodetectLockFile } from "./src/util/autodetectLockFile";

const program = new Command();
program
    .name("roest")
    .description(
        "CLI tool to check how long ago each package in package.json was last updated",
    )
    .version("1.0.0");

program
    .command("check")
    .description("Check package update status")
    .option("-f, --file <path>", "Path to your lock file")
    .option("-o, --output <path>", "Output file path", "./output.json")
    .action(async (options) => {
        const lockFilePath = options.file ? resolve(options.file) : null;
        const outputPath = options.output ? resolve(options.output) : null;

        const filePath = lockFilePath ?? autodetectLockFile(process.cwd());
        if (!filePath) {
            throw new Error(
                "Could not find a supported lock file in the current directory",
            );
        }
        const lockFileContent = readFileSync(filePath, "utf-8");

        await analyzePackageFile({
            lockFilePath: filePath,
            lockFileContent,
            outputPath,
        });
    });

program
    .command("repo")
    .description("Analyze all packages in a repo")
    .argument("<repo>", "Github repo to analyze in format <owner>/<repository>")
    .option("-o, --output <path>", "Output file path", "./output.json")
    .action(async (repositoryPath, options) => {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error("GITHUB_TOKEN environment variable not set");
        }

        const outputPath = options.output ? resolve(options.output) : null;
        await analyzeRepo({ repositoryPath, outputPath, token });
    });

program
    .command("show")
    .description("Generate HTML report from analysis output")
    .argument("[input]", "Input JSON file path", "./output.json")
    .option("-o, --output <path>", "Output HTML file path", "./report.html")
    .action(async (inputPath, options) => {
        const resolvedInputPath = resolve(inputPath);
        const resolvedOutputPath = resolve(options.output);

        await generateHtmlReport({
            inputPath: resolvedInputPath,
            outputPath: resolvedOutputPath,
        });
    });

program.parse();
