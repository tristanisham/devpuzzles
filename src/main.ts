import express from "express";
import process from "node:process";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { Liquid } from "liquidjs";
import path from "node:path";
import * as routes from "./routes/mod.js"
import bodyParser from "body-parser";
import { loadPuzzlesRecursively } from "./puzzle-api.js";
// Server configuration starts
const app = express();
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
});
app.use(limiter);

const engine = new Liquid({
    cache: process.env.NODE_ENV === "production",
    extname: ".liquid",
});
app.engine("liquid", engine.express());
app.set("views", [
    path.join(process.cwd(), "templates/"),
    path.join(process.cwd(), "views/"),
]);
app.set("view engine", "liquid");

// Router
app.get("/", (_req, res): any => {
    res.render("index", {
        title: "Dev Puzzles",
    });
});

await loadPuzzlesRecursively("puzzles", app);

// Kepler
app.get("/format/1", routes.fmtFirstPuzzle);
app.post("/format/1", routes.fmtFirstPuzzlePOST)

if (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined
) {
    console.log("http://localhost:3000");
}

app.listen(3000);
