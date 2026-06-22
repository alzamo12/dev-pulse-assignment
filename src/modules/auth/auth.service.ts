import bcrypt from "bcryptjs";
import { pool } from "../../db";
import { IUser } from "./auth.interface";
import { threadCpuUsage } from "node:process";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";

const createUserIntoDB = async (payload: IUser) => {
    const { name, email, password, role } = payload;

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'user'))
        RETURNING *
        ` , [name, email, hashPassword, role]);

    const user = result.rows[0];
    delete user.password;
    return user
};

const loginUserIntoDB = async (payload: any) => {
    const { email, password } = payload;
    const userDetails = await pool.query(`
        SELECT * FROM users WHERE email = $1
        `, [email]);

    if (userDetails.rowCount === 0) {
        throw new Error("User not found");
    };

    const user = userDetails.rows[0];
    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword) {
        throw new Error("Invalid Credentials")
    };

    const jwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const token = jwt.sign(jwtPayload, config.access_token as string, {
        expiresIn: '1d'
    });

    delete user.password

    return {user, token}
}

export const authService = {
    createUserIntoDB,
    loginUserIntoDB
};