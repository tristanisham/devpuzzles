import "dotenv/config";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import process from "node:process";

type ReducedUser = Omit<User, "password">
export type UserProfile = ReducedUser & { role: string }

// Extend Express Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: UserProfile; // Adjust the type according to what you store in JWT payload
        }
    }
}

// Refuse to boot without a real secret. An undefined secret makes jwt.sign
// throw on every signup, and a short one makes every session token in the
// system brute-forceable, so this is worth failing loudly at startup.
const configuredSecret = process.env.TOKEN_SECRET;
if (configuredSecret === undefined || configuredSecret.length < 32) {
    throw new Error(
        "TOKEN_SECRET must be set to at least 32 characters. Generate one with `openssl rand -hex 32`.",
    );
}
const TOKEN_SECRET: string = configuredSecret;

// Pin the algorithm so a token can never dictate how it gets verified.
const JWT_ALGORITHM = "HS256" as const;

const TOKEN_COOKIE = "token";
const TOKEN_COOKIE_PATH = "/";

function readToken(req: Request): string | undefined {
    const token: unknown = req.cookies?.[TOKEN_COOKIE];
    return typeof token === "string" && token !== "" ? token : undefined;
}

function verifyToken(token: string): UserProfile | undefined {
    try {
        return jwt.verify(token, TOKEN_SECRET, { algorithms: [JWT_ALGORITHM] }) as UserProfile;
    } catch {
        return undefined;
    }
}

export async function authTokenHeader(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return res.sendStatus(401)

    const user = verifyToken(token)
    if (user === undefined) return res.sendStatus(403)

    req.user = user;
    next()
}

export async function authTokenCookie(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req)

    if (token === undefined) return res.sendStatus(401)

    const user = verifyToken(token)
    if (user === undefined) {
        // Stale or forged cookie: drop it so the client can log in again
        // instead of replaying a token that will never verify.
        res.clearCookie(TOKEN_COOKIE, { path: TOKEN_COOKIE_PATH })
        return res.sendStatus(401)
    }

    req.user = user;
    next()
}

export async function getToken(req: Request, res: Response, next: NextFunction) {
    req.user = undefined;

    const token = readToken(req)
    if (token === undefined) return next();

    const user = verifyToken(token)
    if (user === undefined) {
        // This middleware runs on every route, so rejecting here would lock a
        // visitor out of the whole site - including /login and /logout - the
        // moment their 3h token expired, with no way to clear the cookie.
        // Treat an unverifiable token as "not signed in" instead.
        res.clearCookie(TOKEN_COOKIE, { path: TOKEN_COOKIE_PATH })
        return next()
    }

    req.user = user;
    next()
}


export function generateAccessToken(user: {
    handle: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: {
        role: string;
    }
}): string {
    const options: jwt.SignOptions = {
        expiresIn: '3h',
        algorithm: JWT_ALGORITHM,
    }

    const reduced: Partial<UserProfile> = {
        handle: user.handle,
        name: user.name,
        role: user.role.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }


    return jwt.sign(reduced, TOKEN_SECRET, options)
}
