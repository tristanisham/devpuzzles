import { PrismaClient, User } from "@prisma/client";
import { Request, Response } from "express";
import { UserProfile } from "../auth.js";

export const profileGet = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const handle: string | undefined = req.params.handle;
    if (handle === undefined) {
        res.status(404);
        return;
    }



    const fullUser = await prisma.user.findUnique({
        where: {
            handle: handle
        },
        include: {
            role: true,
            posts: true
        }
    });

    // Is this a bad idea?
    const authorized = req.user?.handle === fullUser?.handle


    res.render("profile", {
        user: fullUser,
        authorized: authorized,
    })

}
