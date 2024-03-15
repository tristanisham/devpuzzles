import express from "express";
import process from "node:process";
import morgan from "morgan";
import { create as hbsCreate } from 'express-handlebars';
import * as routes from "./routes/mod.js";
import bodyParser from "body-parser";
// import { loadPuzzlesRecursively } from "./puzzle-api.js";
import { PrismaClient } from '@prisma/client'
import cookieParser from "cookie-parser";
import { faker } from '@faker-js/faker';
import { getToken as getUserToken } from "./auth.js";
import helmet from "helmet";


// Server configuration starts
const app = express();
const prisma = new PrismaClient();

// Define a custom token to log the 'X-Forwarded-For' header
morgan.token('x-forwarded-for', (req, res) => (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'].join(", ") : req.headers['x-forwarded-for']) || req.socket.remoteAddress);

app.use(morgan(":method :url :status :response-time ms - :x-forwarded-for"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
// This sets custom options for the
// Content-Security-Policy header.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "devpuzzles.com", "https://cdn.jsdelivr.net", "https://plausible.io"],
      },
    },
  }),
);


const hbs = hbsCreate({
  helpers: {
    json(object: Object) { return JSON.stringify(object) },
    len(data: Array<any>) { return data.length }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.enable('view cache');

app.use(getUserToken)
/**
 *
 * Router
 *
 */
app.get("/", (req, res): void => {
  console.debug(`User signed in: ${req.user !== undefined}; ${req.user?.handle}`)
  res.render("home", {
    title: "DevPuzzles",
    user: req.user
  });
});

app.get("/@:handle", await routes.profileGet(prisma))

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
  req.user = undefined;
  res.redirect("/");
})

app.route("/signup")
  .get((req, res): void => {
    res.render("signup", {
      title: "Signup | DevPuzzles",
      usernamePH: faker.internet.userName(),
      namePH: faker.person.fullName(),
      user: req.user


    })
  })
  .post(await routes.signupPost(prisma))

// await loadPuzzlesRecursively("puzzles", app);


const disconnectDB = async () => await prisma.$disconnect();

app.listen(3000, () => console.log("http://localhost:3000")).on("close", disconnectDB)

// Listen for termination signals
process.on('SIGINT', disconnectDB);
process.on('SIGTERM', disconnectDB);
