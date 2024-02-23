import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { User } from "@prisma/client";
import process from "node:process";

interface ReducedUser {
    handle: string,
    name: string | null,
    createdAt: Date,
    updatedAt: Date,
}


// Extend Express Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: ReducedUser; // Adjust the type according to what you store in JWT payload
        }
    }
}

export async function authTokenHeader(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: string | jwt.JwtPayload | undefined) => {
        if (err) return res.sendStatus(403)

        req.user = user as ReducedUser;
        // We don't need the password after auth;


        next()
    })
}

export async function authTokenCookie(req: Request, res: Response, next: NextFunction) {
    const token: string | undefined = req.cookies['token']

    if (token === undefined) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: string | jwt.JwtPayload | undefined) => {
        if (err) return res.sendStatus(403)

        req.user = user as ReducedUser;
        // We don't need the password after auth;


        next()
    })
}

export async function getToken(req: Request, res: Response, next: NextFunction) {
    const token: string | undefined = req.cookies['token']

    if (token === undefined) {
        req.user = undefined;
        next();
        return;
    }

    jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: string | jwt.JwtPayload | undefined) => {
        if (err) return res.sendStatus(403)

        req.user = user as ReducedUser;
        // We don't need the password after auth;


        next()
    })
}


export function generateAccessToken(user: User): string {
    const options: jwt.SignOptions = {
        expiresIn: '3h',
    }

    const reduced: ReducedUser = {
        handle: user.handle,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }


    return jwt.sign(reduced, process.env.TOKEN_SECRET as string, options)
}


