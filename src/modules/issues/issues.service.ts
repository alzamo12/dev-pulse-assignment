import { pool } from "../../db";
import { IIssues, TIssueQuery } from "./issues.interface";

const types: string[] = ['bug', 'feature_request'];

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

const getAllIssuesFromDB = async (query: TIssueQuery) => {
    const conditions: string[] = [];
    const values: any[] = [];

    let sql = `SELECT * FROM issues`;

    if (query.type) {
        values.push(query.type);
        conditions.push(`type = $${values.length}`);
    }

    if (query.status) {
        values.push(query.status);
        conditions.push(`status = $${values.length}`);
    }

    if (conditions.length) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql +=
        query.sort === "oldest"
            ? ` ORDER BY created_at ASC`
            : ` ORDER BY created_at DESC`;

    const issueResult = await pool.query(sql, values);
    const issues = issueResult.rows;

    if (!issues.length) {
        return [];
    }

    const reporterIds = [
        ...new Set(issues.map(issue => issue.reporter_id)),
    ];

    const reporterResult = await pool.query(
        `
      SELECT id, name, role
      FROM users
      WHERE id = ANY($1)
    `,
        [reporterIds]
    );

    const reporterMap = new Map(
        reporterResult.rows.map(user => [user.id, user])
    );

    return issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterMap.get(issue.reporter_id),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    }));
};

export const issuesService = {
    createIssueIntoDB,
    getAllIssuesFromDB
}