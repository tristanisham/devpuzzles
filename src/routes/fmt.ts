import { Request, Response } from "express";
import { distance } from "fastest-levenshtein";

export const fmtFirstPuzzle = (req: Request, res: Response): void => {

  res.render("puzzles/fmt-1", {
    title: "fmt 1"
  })
};

export const fmtFirstPuzzlePOST = (req: Request, res: Response): void => {
  const message = req.body.message;
  const expected = "Congratulations employee #{ employee_id }, you have been promoted. Your new salary is + $0 greater than your current. Your new title is \"Scrum Master\". Congratulations.";
  const score = distance(expected, message)
  if (score < 5 && score > 0) {
    res.setHeader('content-type', 'text/plain');
    res.send("Close enough. You got it bozo. I'll be sure to mention you in my report.")
  } else if (score === 0) {
    res.setHeader('content-type', 'text/plain');
    res.send("Holy shmoozala, you found it. Here's a gold star 🌟");
  } else {
    res.setHeader('content-type', 'text/plain');
    res.send(`I can't send this in a Teams' meeting. They'll ask questions. I need a more accurate answer than ${score}`);
  }
}
