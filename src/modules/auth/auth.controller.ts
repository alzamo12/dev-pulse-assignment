import type { Request, Response } from "express";

const createUser = async (req: Request, res: Response) => {
    try {
        console.log('from auth controller ', req.body)
        res.send(req.body)
    } catch (err:any) {
        res.status(500).send({
            success: false,
            message: err.message,
            error: err
        })
    }
};

export const authController = {
    createUser
};