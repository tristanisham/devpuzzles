import express from "express";
import process from "node:process";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit"

// Server configuration starts
const app = express();
app.use(morgan('tiny'))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
});
app.use(limiter);

app.get("/", (_req, res): any => {
    res.type("text/plain")
    res.send("Hi gamer")
});

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined) {
    console.log("http://localhost:3000")
}

app.listen(3000);