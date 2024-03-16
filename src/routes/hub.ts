import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export const hubGet = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    if (req.user === null || req.user === undefined) {
        return res.status(401).send("Sorry chap, this ain't your hub.")
    }

    res.render("hub", {
        title: "DevPuzzles",
        user: req.user
    })

}
