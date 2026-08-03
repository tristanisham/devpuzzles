import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export const profileGet = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const handle: string | undefined = req.params.handle;
    if (handle === undefined) {
        res.status(404);
        res.send("No handle provided.")
        return;
    }



    // Profiles are public, so select only the fields the template needs. The
    // previous query handed the whole User row - including the bcrypt password
    // hash and the account's email - to the view context.
    const fullUser = await prisma.user.findUnique({
        where: {
            handle: handle
        },
        select: {
            handle: true,
            name: true,
            createdAt: true,
            role: {
                select: { role: true }
            },
            posts: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                }
            }
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
