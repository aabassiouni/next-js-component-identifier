/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import * as babel from "@babel/parser";
import { globSync } from "glob";
import traverse, { type NodePath } from "@babel/traverse";
import type { ImportDeclaration } from "@babel/types";
import { checkForClientDirective, getAppFolder, getRoutes, getTsConfigPathAliases } from "./utils";
import { TreeNode } from "./tree";

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

// function traverseImports(route: TreeNode, fileName: string) {
//     console.log("traversing imports for", route.value.path);

//     const filePath = path.join(route.value.path, fileName);
//     console.log("checking file", filePath);

//     const code = fs.readFileSync(filePath, "utf-8");
//     const ast = babel.parse(code, {
//         sourceType: "module",
//         plugins: ["jsx", "typescript"],
//     });

//     const containsClientDirective = checkForClientDirective(ast);
//     console.log("1) contains client directive", containsClientDirective);

//     if (containsClientDirective) {
//         console.log(`\tsetting ${route.value.path} to client\n`);
//         route.value.componentType = "client";
//     } else {
//         console.log(`\tsetting ${route.value.path} to server\n`);
//         route.value.componentType = "server";
//     }

//     traverse(ast, {
//         ImportDeclaration(importPath: NodePath<ImportDeclaration>) {
//             const source = importPath.node.source.value;
//             if (importPath.node.importKind === "type") {
//                 return; // Skip over TypeScript type imports
//             }

//             if (source.startsWith(".")) {
//                 console.log("\tfound relative import:", source);

//                 //find the path for this import
//                 const matchedPaths = globSync(`**/${source}.{js,ts,tsx,jsx}`, {
//                     cwd: projectFolder,
//                     ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
//                     absolute: true,
//                 });

//                 if (matchedPaths.length === 0) {
//                     console.error("no paths found");
//                     return;
//                 }

//                 const fullSourcePath = matchedPaths[0];

//                 const treeNode = new TreeNode({
//                     name: source,
//                     path: fullSourcePath,
//                 });
//                 route.addChild(treeNode);
//                 console.log("\ttraversing imports for fullSourcePath", fullSourcePath, "{\n");

//                 traverseImports(treeNode, "");
//             }

//             for (const alias in aliases) {
//                 const cleanAlias = alias.replace(/\*/, "");
//                 console.log("\tfound relative import:", source);

//                 // check if import is using an alias from tsconfig.json
//                 if (source.startsWith(cleanAlias)) {
//                     const newSource = source.replace(cleanAlias, "./");
//                     const matchedPaths = globSync(`**/${newSource}.{js,ts,tsx,jsx}`, {
//                         cwd: projectFolder,
//                         ignore: ["**/node_modules/**", "**/.next/**", "**/.git/**"],
//                         absolute: true,
//                     });

//                     if (matchedPaths.length === 0) {
//                         console.error("no paths found");
//                         return;
//                     }

//                     const fullSourcePath = matchedPaths[0];

//                     const treeNode = new TreeNode({
//                         name: newSource,
//                         path: fullSourcePath,
//                     });
//                     route.addChild(treeNode);

//                     traverseImports(treeNode, "");
//                 }
//             }
//         },
//     });
// }

export async function activate(context: vscode.ExtensionContext) {
    if (!vscode?.workspace?.workspaceFolders?.length) {
        return;
    }

    const isNextProject = checkIfNextProject();

    if (!isNextProject) {
        return;
    }

    const projectFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const aliases = getTsConfigPathAliases(projectFolder);
    console.log("aliases: ", aliases);

    const appFolder = getAppFolder(projectFolder);
    console.log("app folder:", appFolder);

    const routes = getRoutes(appFolder);
    console.log(routes);

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
    statusBarItem.text = "Scanning project for client components...";

    // context.subscriptions.push(
    //     vscode.commands.registerCommand("extension.scan", async () => {
    //         if (!isNextProject) {
    //             return;
    //         }

    //         await scanProjectForClientComponents(projectFolder);
    //     })
    // );

    // context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
}

export function deactivate() {}
