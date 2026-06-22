import bcrypt from "bcryptjs";
import { pool } from "../../db";
import { IUser } from "./auth.interface";

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
    const result = await pool.query(`
        
        `, []);
    return result
}

export const authService = {
    createUserIntoDB,
    loginUserIntoDB
};