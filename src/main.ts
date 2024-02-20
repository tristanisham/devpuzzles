import express from "express";
import process from "node:process";

(async () => {
    const app = express();

    app.get("/", (_req, res): any => {
        res.type("text/plain")
        res.send("Hi gamer")
    });

    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined) {
        console.log("http://localhost:3000")
    }

    app.listen(3000);
})();