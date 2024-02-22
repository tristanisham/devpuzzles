import { Request, Response } from "express";
import { generateAccessToken, validatePassword } from "../auth.js";
import validator from "validator";
import { PrismaClient, User } from "@prisma/client";
import bcyrpt from "bcrypt";

const prisma = new PrismaClient();


export const loginPost = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const formData = req.body;

    if (formData.email === undefined || formData.password === undefined) {
        res.send("Mising email or password. This is a bad request hommie.")
        res.status(401)
        return
    }

    const email: string = formData.email;
    const password: string = formData.password;

    if (!validatePassword(password)) {
        res.send(`Your password was deemed lame (insecure).
    
          - Minimum Length: The password should be at least 8 characters long.
          - Upper and Lowercase Letters: The password should include both uppercase and lowercase characters.
          - Numbers: The password should contain at least one number.
          - Special Characters: The password should include at least one special character (e.g., !@#$%^&*).`)
        res.status(401)

        return
    } else if (!validator.isEmail(email)) {
        res.send("You need to pass a valid email. Otherwise, the only thing I'm passing your way will be gas.")
        res.status(401)
        return
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        }
    })

    if (user) {
        const match = await bcyrpt.compare(password, user.password)
        if (match) {
            const token = generateAccessToken(user);
            res.cookie('token', token, {
                maxAge: 10800000, // Expires in 3 hours, matches token expiration
                secure: true, // Set to true if you're using https
                httpOnly: true, // Prevents client-side JS from reading the cookie
                sameSite: 'strict', // Can be 'strict', 'lax', or 'none',
                path: '/'
            })



            res.redirect("/")
        } else {
            res.status(403)
            res.redirect('/login?err=You%20goof.%20You%20absolute%20bongus.%20You%20got%20your%20password%20wrong.')
        }
    }

    // const token = generateAccessToken()
    // res.cookie('token', , {
    //   maxAge: 10800000, // Expires in 3 hours, matches token expiration
    //   secure: true, // Set to true if you're using https
    //   httpOnly: true, // Prevents client-side JS from reading the cookie
    //   sameSite: 'strict' // Can be 'strict', 'lax', or 'none'
    // })
}


export const signupPost = async (prisma: PrismaClient) => async (req: Request, res: Response) => {
    const formData = req.body;

    if (formData.email === undefined || formData.password === undefined || formData.handle === undefined || formData.name === undefined) {
        res.send("Mising email, handle, or password. This is a bad request hommie.")
        res.status(401)
        return
    }

    const email: string = formData.email;
    const password: string = formData.password;
    const handle: string = formData.handle;
    const name: string = formData.name;

    if (!validatePassword(password)) {
        res.send(`Your password was deemed lame (insecure).

      - Minimum Length: The password should be at least 8 characters long.
      - Upper and Lowercase Letters: The password should include both uppercase and lowercase characters.
      - Numbers: The password should contain at least one number.
      - Special Characters: The password should include at least one special character (e.g., !@#$%^&*).`)
        res.status(401)

        return
    } else if (!validator.isEmail(email)) {
        res.send("You need to pass a valid email. Otherwise, the only thing I'm passing your way will be gas.")
        res.status(401)
        return
    }

    const pwd = await bcyrpt.hash(password, 10);


    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { handle: handle }
            ],
        },
    });

    if (existingUser) {
        res.redirect("/login?msg=Try%20logging%20in.%20This%20email%27s%20already%20in%20our%20system.")
        return;
    }

    const _ = await prisma.user.create({
        data: {
            email: email,
            password: pwd,
            handle: handle,
            name: name || null
        }
    })

    res.redirect("/login?msg=Succsess%21%20Now%20log%20in%21")


}