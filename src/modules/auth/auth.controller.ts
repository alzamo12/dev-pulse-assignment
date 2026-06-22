import type { Request, Response } from "express";
import { authService } from "./auth.service";

const createUser = async (req: Request, res: Response) => {
    try {
        // console.log('from auth controller ', req.body);
        const result = await authService.createUserIntoDB(req.body);
        res.status(201).send({
            success: true,
            message: "User registered successfully",
            data: result
        })
    } catch (err: any) {
        res.status(500).send({
            success: false,
            message: err.message,
            error: err
        })
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);
        const {user, token} = result;
        res.status(201).send({
            success: true,
            message: 'Login Successful',
            data: {
                token,
                user
            }
        })

    } catch (err: any) {
        res.status(500).send({
            success: false,
            message: err.message,
            error: err
        })
    }
};

export const authController = {
    createUser,
    loginUser
};