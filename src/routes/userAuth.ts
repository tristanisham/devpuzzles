import { Request, Response } from "express";
import { UserProfile, generateAccessToken } from "../auth.js";
import validator from "validator";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

// A real hash of a value nobody can supply. Comparing against this when the
// account does not exist keeps the failure path the same cost as a genuine
// wrong-password check, so login timing can't be used to probe which emails
// are registered.
const ABSENT_USER_HASH = bcrypt.hashSync("no-such-account", BCRYPT_ROUNDS);

// Identical response for "no such user" and "wrong password" - anything that
// distinguishes the two turns the login form into an account oracle.
const BAD_CREDENTIALS = "/login?msg=Those%20credentials%20didn%27t%20work.%20Check%20your%20email%20and%20password.";

const PASSWORD_POLICY = {
    minNumbers: 0,
    returnScore: false as const,
    minSymbols: 0,
};

const WEAK_PASSWORD_MESSAGE = `Your password was deemed lame (insecure).

      - Minimum Length: The password should be at least 8 characters long.
      - Upper and Lowercase Letters: The password should include both uppercase and lowercase characters.
      - Numbers: The password should contain at least one number.
      - Special Characters: The password should include at least one special character (e.g., !@#$%^&*).`;

// Handles end up in URLs (/@:handle) and in rendered pages, so keep them to a
// conservative character set rather than storing whatever was posted.
const HANDLE_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;
const MAX_NAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 200;

function readField(value: unknown): string {
    return typeof value === "string" ? value : "";
}

export const loginPost = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const formData = req.body ?? {};

    const email = readField(formData.email);
    const password = readField(formData.password);

    if (email === "" || password === "") {
        res.status(400).send("Missing email or password. This is a bad request hommie.")
        return
    }

    // bcrypt only reads the first 72 bytes, but there is no reason to hand an
    // unbounded string to the hasher.
    if (password.length > MAX_PASSWORD_LENGTH) {
        res.redirect(BAD_CREDENTIALS)
        return
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
        include: {
            role: true
        }
    })

    // Always compare, even when there is no user, so both branches take the
    // same time. Note this deliberately no longer runs the signup password
    // policy on login: it gave no security benefit and permanently locked out
    // any account whose password predated the current rules.
    const match = await bcrypt.compare(password, user?.password ?? ABSENT_USER_HASH)

    if (user === null || !match) {
        res.redirect(BAD_CREDENTIALS)
        return
    }

    const token = generateAccessToken(user);
    res.cookie('token', token, {
        maxAge: 10800000, // Expires in 3 hours, matches token expiration
        secure: true, // Set to true if you're using https
        httpOnly: true, // Prevents client-side JS from reading the cookie
        sameSite: 'strict', // Can be 'strict', 'lax', or 'none',
        path: '/'
    })


    req.user = {
        name: user.name,
        handle: user.handle,
        role: user.role.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    } as UserProfile;

    res.redirect("/")
}


export const signupPost = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const formData = req.body ?? {};

    const email = readField(formData.email);
    const password = readField(formData.password);
    const handle = readField(formData.handle);
    const name = readField(formData.name);

    if (email === "" || password === "" || handle === "") {
        res.status(400).send("Missing email, handle, or password. This is a bad request hommie.")
        return
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        res.status(400).send("That password is longer than we can store. Keep it under 200 characters.")
        return
    }

    if (!validator.isStrongPassword(password, PASSWORD_POLICY)) {
        res.status(400).send(WEAK_PASSWORD_MESSAGE)
        return
    }

    if (!validator.isEmail(email)) {
        res.status(400).send("You need to pass a valid email. Otherwise, the only thing I'm passing your way will be gas.")
        return
    }

    if (!HANDLE_PATTERN.test(handle)) {
        res.status(400).send("Handles must be 3-30 characters, letters, numbers, underscores and dashes only.")
        return
    }

    if (name.length > MAX_NAME_LENGTH) {
        res.status(400).send(`Keep your name under ${MAX_NAME_LENGTH} characters.`)
        return
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { handle: handle }
            ],
        },
        select: { id: true },
    });

    // Don't say which of the two collided - that would confirm whether a given
    // email is registered.
    if (existingUser) {
        res.redirect("/login?msg=That%20email%20or%20handle%20is%20already%20taken.")
        return;
    }

    const pwd = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
        await prisma.user.create({
            data: {
                email: email,
                password: pwd,
                handle: handle,
                name: name || null,
                roleId: 1
            }
        })
    } catch (err) {
        // The unique constraint can still fire if someone registered the same
        // email or handle between the check above and this insert.
        console.error(err)
        res.status(500).send("Something went wrong creating your account. Try again.")
        return
    }


    res.redirect("/login?msg=Succsess%21%20Now%20log%20in%21")
}
