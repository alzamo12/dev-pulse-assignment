import { pool } from "../../db";
import { IUser } from "./auth.interface";

const createUserIntoDB = async (payload: IUser) => {
    const { name, email, password, role } = payload;

    const result = await pool.query(`
        INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, COALESCE($4, 'user'))
        RETURNING *
        ` , [name, email, password, role]);

    const user = result.rows[0];
    delete user.password;
    return user
};

export const authService = {
    createUserIntoDB
};