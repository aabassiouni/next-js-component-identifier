/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import * as babel from "@babel/parser";
import { globSync } from "glob";
import traverse, { type NodePath } from "@babel/traverse";
import type { ImportDeclaration } from "@babel/types";
import { checkForClientDirective, getAppFolder, getRoutes, getTsConfigPathAliases } from "./utils";
import { Tree, TreeNode } from "./tree";

if (!vscode?.workspace?.workspaceFolders?.length) {
}

function checkIfNextProject() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(vscode.workspace.rootPath + "/package.json").toString());
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;

    if (!nextVersion) {
      vscode.window.showErrorMessage("Not a Next.js project");
      return false;
    } else {
      return true;
    }
  } catch {
    vscode.window.showErrorMessage("Could not find package.json");
    return false;
  }
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("starting next-js-app-router-helper extension");
  if (!vscode?.workspace?.workspaceFolders?.length) {
    return;
  }

  const isNextProject = checkIfNextProject();

  if (!isNextProject) {
    return;
  }

  const projectFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

  //find ts path aliases
  const aliases = getTsConfigPathAliases(projectFolder);
  console.log("aliases: ", aliases);

  // find /app folder
  const appFolder = getAppFolder(projectFolder);
  console.log("app folder:", appFolder);

  //get all routes
  const routes = getRoutes(appFolder);
  console.log(routes);

  // create a tree for each route
  const routeTrees: Map<string, Tree> = new Map();
  routes.forEach((route) => {
    console.log("adding route", route);

    routeTrees.set(
      route,
      new Tree({
        name: route,
        path: path.join(appFolder, route),
      })
    );
  });

  routeTrees.forEach((routeTree) => {
    traverseImports(routeTree.root, "page.tsx");
    console.log("Done for this route: ", routeTree.root.value.name);
    routeTree.print();
  });

  // const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
  // statusBarItem.text = "Scanning project for client components...";

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.openTreeView", () => {
      const panel = vscode.window.createWebviewPanel(
        "openWebview", // Identifies the type of the webview. Used internally
        "Example Page", // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
          // Enable scripts in the webview
          enableScripts: true, //Set this to true if you want to enable Javascript.
        }
      );
      const filePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, "src", "tree.html"));

      // panel.webview.html = fs.readFileSync(filePath.fsPath, "utf8");
      function getWebviewContent() {
        const html = `<html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Example Page</title>
                    </head>
                    <body>
                        <h1>Example Page</h1>

                        <p>This is an example web page.</p>
                    </body>
                </html>`;
        return html;
      }
      panel.webview.html = getWebviewContent();
    })
  );

  vscode.commands.executeCommand("extension.openTreeView");
  function traverseImports(route: TreeNode, fileName: string) {
    console.log("traversing imports for", route.value.path);

    const filePath = path.join(route.value.path, fileName);
    console.log("checking file", filePath);

    const code = fs.readFileSync(filePath, "utf-8");
    const ast = babel.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const containsClientDirective = checkForClientDirective(ast);
    console.log("1) contains client directive", containsClientDirective);

    if (containsClientDirective) {
      console.log(`\tsetting ${route.value.path} to client\n`);
      route.value.componentType = "client";
    } else {
      console.log(`\tsetting ${route.value.path} to server\n`);
      route.value.componentType = "server";
    }

    traverse(ast, {
      ImportDeclaration(importPath: NodePath<ImportDeclaration>) {
        const source = importPath.node.source.value;
        if (importPath.node.importKind === "type") {
          return; // Skip over TypeScript type imports
        }

        if (source.startsWith(".")) {
          console.log("\tfound relative import:", source);

          //find the path for this import
          const matchedPaths = globSync(`**/${source}.{js,ts,tsx,jsx}`, {
            cwd: projectFolder,
            ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
            absolute: true,
          });

          if (matchedPaths.length === 0) {
            console.error("no paths found");
            return;
          }

          const fullSourcePath = matchedPaths[0];

          const treeNode = new TreeNode({
            name: source,
            path: fullSourcePath,
          });
          route.addChild(treeNode);
          console.log("\ttraversing imports for fullSourcePath", fullSourcePath, "{\n");

          traverseImports(treeNode, "");
        }

        for (const alias in aliases) {
          const cleanAlias = alias.replace(/\*/, "");
          console.log("\tfound relative import:", source);

          // check if import is using an alias from tsconfig.json
          if (source.startsWith(cleanAlias)) {
            const newSource = source.replace(cleanAlias, "./");
            const matchedPaths = globSync(`**/${newSource}.{js,ts,tsx,jsx}`, {
              cwd: projectFolder,
              ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
              absolute: true,
            });

            if (matchedPaths.length === 0) {
              console.error("no paths found");
              return;
            }

            const fullSourcePath = matchedPaths[0];

            const treeNode = new TreeNode({
              name: newSource,
              path: fullSourcePath,
            });
            route.addChild(treeNode);

            traverseImports(treeNode, "");
          }
        }
      },
    });
  }
}

export function deactivate() {}
