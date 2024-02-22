import express from "express";
import process from "node:process";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import { Liquid } from "liquidjs";
import path from "node:path";
import * as routes from "./routes/mod.js";
import bodyParser from "body-parser";
// import { loadPuzzlesRecursively } from "./puzzle-api.js";
import { PrismaClient } from '@prisma/client'
import cookieParser from "cookie-parser";
import { generateAccessToken, validatePassword } from "./auth.js";
import { faker } from '@faker-js/faker';




// Server configuration starts
const app = express();
const prisma = new PrismaClient();
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

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

/**
 * 
 * Router
 * 
 */
app.get("/", (_req, res): void => {
  res.render("index", {
    title: "Dev Puzzles",
  });
});

app.route("/login")
  .get((req, res): void => {
    res.render("login", {
      title: "Login | DevPuzzles",
      msg: req.query.msg,
    })
  })
  .post(await routes.loginPost(prisma))

app.get("/logout", (req, res): void => {
  res.clearCookie('token', { path: '/' });
  res.redirect("/");
})

app.route("/signup")
  .get((req, res): void => {
    res.render("signup", {
      title: "Signup | DevPuzzles",
      usernamePH: faker.internet.userName(),
      namePH: faker.person.fullName(),
    })
  })
  .post(await routes.signupPost(prisma))

// await loadPuzzlesRecursively("puzzles", app);


const disconnectDB = async () => await prisma.$disconnect();

app.listen(3000, () => console.log("http://localhost:3000")).on("close", disconnectDB)

// Listen for termination signals
process.on('SIGINT', disconnectDB);
process.on('SIGTERM', disconnectDB);
