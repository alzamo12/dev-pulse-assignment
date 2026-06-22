import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        // console.log(token)
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        };

        const decode = jwt.verify(token as string, config.access_token as string) as JwtPayload;
        console.log(decode)

        const user = await pool.query(`
            SELECT * FROM users WHERE email = $1
            `, [decode.email]);

        // console.log(user.rows[0])

        if (user.rowCount === 0) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        };

        req.user = decode;

        next();
    } catch (err) {
        next(err)
    }
}

export default auth;