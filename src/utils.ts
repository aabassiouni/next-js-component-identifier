import traverse from "@babel/traverse";
import { globSync } from "glob";
import * as fs from "node:fs";
import * as path from "node:path";
import * as babel from "@babel/parser";
import { type NodePath } from "@babel/traverse";
import type { Directive, File, ImportDeclaration } from "@babel/types";

export function getTsConfigPathAliases(
  projectFolder: string
): Record<string, string> {
  // search for tsconfig.json in the project folder
  const tsConfigPath = globSync("**/tsconfig.json", {
    cwd: projectFolder,
    dot: true,
    ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
    absolute: true,
  })?.[0];
  console.log("ts config path: ", tsConfigPath);

  try {
    const tsConfigContents = fs.readFileSync(tsConfigPath, "utf-8");
    const tsConfig = JSON.parse(tsConfigContents);
    const baseUrl = tsConfig?.compilerOptions?.baseUrl || ".";
    const paths = tsConfig?.compilerOptions?.paths || {};

    const aliases: Record<string, string> = {};
    for (const alias in paths) {
      aliases[alias] = path.resolve(projectFolder, baseUrl, paths[alias][0]);
    }

    return aliases;
  } catch (error) {
    console.error("Could not read tsconfig.json", error);
    return {};
  }
}

export function getAppFolder(projectFolder: string) {
  const appFolder = path.resolve(
    projectFolder,
    globSync("**/app/", {
      cwd: projectFolder,
      dot: true,
      ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
    })?.[0]
  );
  return appFolder;
}

export function getRoutes(appFolder: string) {
  const routes = new Set<string>();

  const paths = globSync("**/*{page,layout}.{js,jsx,ts,tsx}", {
    cwd: appFolder,
    dot: true,
    ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
    // absolute: true,
  });
  console.log("paths", paths);
  for (const path of paths) {
    const route =
      "/" +
      path
        // .replace(appFolder, "")
        .replace(/(page|layout)\.(js|jsx|ts|tsx)$/, "")
        .replace(/\\/g, "/");

    routes.add(route);
  }

  return routes;
}

export function checkForClientDirective(ast: babel.ParseResult<File>): boolean {
  let containsClientDirective = false;

  traverse(ast, {
    Directive(path: NodePath<Directive>) {
      const directive = path.node.value.value;
      if (directive === "use client") {
        containsClientDirective = true;
        path.stop();
      }
    },
  });

  return containsClientDirective;
}
