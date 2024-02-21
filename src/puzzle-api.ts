import { Request, Response } from "express";
// import path from "node:path";
import { URL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { Express } from "express";
import process from "node:process";
import 'dotenv/config'

export default interface PuzzleConfig {
    name: string,
    description: string,
    author: string,
    routes: Route[],
}

export interface Route {
    path: string | RegExp,
    method: Method,
    handler: Handler
}

export type Handler = (req: Request, res: Response) => void;

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "CONNECT" | "OPTIONS" | "TRACE"

/**
 * loadPuzzlesRecursively imports puzzles from a directory and appends the routes to the webserver.
 * @param {string} puzzlePath valid path for puzzle.
 */
export async function loadPuzzlesRecursively(puzzlePath: string, app: Express) {
    if (!(await fs.stat(puzzlePath)).isDirectory()) {
        throw new Error(`${puzzlePath} must be a directory.`)
    }

    const puzzles = await fs.readdir(puzzlePath, { recursive: true });

    for (const entry of puzzles) {
        const entryPath = path.join(process.cwd(), puzzlePath, entry)
        const entryStats = await fs.stat(entryPath);

        if (entryStats.isDirectory()) {
            const configFile = path.join(entryPath, "puzzle.mjs");
            try {
                fs.stat(configFile)
            } catch (error) {
                console.info("Skipping irrelevant dir. No puzzle.mjs found")
                continue;
            }

            const puzzleConfig = await import(configFile);
            if (!isValidPuzzleAPI(puzzleConfig.default)) {
                throw new Error("invalid puzzle config")
            }

            const config = puzzleConfig.default as PuzzleConfig;
            // database bs to save name and description
            for (const entry of config.routes) {
                // TODO: Make an actual normalization function
                const puzzleRoute = normalizePuzzleRoute(`${entryPath.replace(process.cwd(), "")}/${entry.path}`)
                console.debug(puzzleRoute)
                switch (entry.method) {
                    case "GET":
                        app.get(puzzleRoute, entry.handler);
                        break;
                    case "POST":
                        app.post(puzzleRoute, entry.handler);
                        break;
                    case "PUT":
                        app.put(puzzleRoute, entry.handler);
                        break;
                    case "PATCH":
                        app.patch(puzzleRoute, entry.handler);
                        break;
                    case "DELETE":
                        app.delete(puzzleRoute, entry.handler);
                        break;
                    case "CONNECT":
                        app.connect(puzzleRoute, entry.handler);
                        break;
                    case "OPTIONS":
                        app.options(puzzleRoute, entry.handler);
                        break;
                    case "TRACE":
                        app.trace(puzzleRoute, entry.handler);
                        break;
                }
            }
        }


    }

}

function normalizePuzzleRoute(route: string): string {
    let nRoute = route.replace("puzzles/", "");
    nRoute = `/puzzle/${nRoute}`;
    let strBuff: string[] = [];

    for (let i = 0; i < nRoute.length; i++) {
        const char = nRoute.charAt(i)
        if (char !== '/' || (char === '/' && nRoute.charAt(i + 1) !== '/')) {
            strBuff.push(char);
        }
    }
    return strBuff.join("")
}

function isValidPuzzleAPI(obj: any): obj is PuzzleConfig {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    // Check if 'name', 'description', and 'routes' properties exist and are of the correct type
    if (typeof obj.name !== 'string' || typeof obj.description !== 'string' || typeof obj.author !== "string" || !Array.isArray(obj.routes)) {
        return false;
    }

    // Check if each route is valid
    for (const route of obj.routes) {
        if (typeof route.path !== 'string' && !(route.path instanceof RegExp)) {
            return false;
        }

        if (!isValidMethod(route.method)) {
            return false;
        }

        if (typeof route.handler !== 'function' || route.handler.length !== 2) {
            return false;
        }
    }

    return true;
}

function isValidMethod(method: any): method is Method {
    return ["GET", "POST", "PUT", "DELETE", "PATCH", "CONNECT", "OPTIONS", "TRACE"].includes(method);
}

