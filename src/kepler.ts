import { Request, Response } from 'express';

export const firstPuzzle = (req: Request, res: Response): void => {
    res.render("kepler/1", {
        title: "Kepler #1"
    })
}