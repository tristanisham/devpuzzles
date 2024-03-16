import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export const profileGet = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const handle: string | undefined = req.params.handle;
    if (handle === undefined) {
        res.status(404);
        res.send("No handle provided.")
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

    if (fullUser === null) {
        res.status(404);
        res.send("User does not exist.")
        return;
    }

    // Is this a bad idea?
    const authorized = req.user?.handle === fullUser?.handle


    res.render("profile", {
        title: "DevPuzzles",
        user: fullUser,
        authorized: authorized,
    })

}
