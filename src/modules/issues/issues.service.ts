import { pool } from "../../db";
import { IIssues } from "./issues.interface";

const types: string[] = ['bug', 'feature_request'];
const statuses: string[] = ['open', 'in_progress', 'resolved'];

const createIssueIntoDB = async (payload: IIssues, reporter_id: string) => {
    const { title, description, type } = payload;

    if ((type && !types.includes(type))) { //bug or feature_request
        throw new Error("Invalid information")
    };

    const result = await pool.query(`
        INSERT INTO issues(title, description, type, reporter_id)
                    VALUES($1, $2, $3, $4)
                    RETURNING *
        `, [title, description, type, reporter_id]);
    // return result
    return result.rows[0];
};

export const issuesService = {
    createIssueIntoDB
}