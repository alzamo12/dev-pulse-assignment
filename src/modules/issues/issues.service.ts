import { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import { IIssues, IUpdateIssue, TIssueQuery } from "./issues.interface";
import { sendResponse } from "../../utils/sendResponse/sendResponse";
import { IUser } from "../auth/auth.interface"
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

    const result = issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporterMap.get(issue.reporter_id),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    }));

    return result
};

const getSingleIssueFromDB = async (id: number) => {
    const issueResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
    );

    const issue = issueResult.rows[0];

    if (!issue) {
        throw new Error("Issue not found")
    };

    const reporterResult = await pool.query(
        `
    SELECT id, name, role
    FROM users
    WHERE id = $1
  `,
        [issue.reporter_id]
    );

    const reporter = reporterResult.rows[0];

    const result = {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    };

    return result;
};

const updateIssueInDB = async (
    issueId: number,
    payload: IUpdateIssue,
    user: IUser
) => {

    const issueResult = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [issueId]
    );

    const issue = issueResult.rows[0];

    if (!issue) {
        throw new Error('issue not found')
    }

    // Authorization

    if (user.role === "contributor") {

        if (issue.reporter_id !== user.id) {
            throw new Error("You can update you own issue only")
        }

        if (issue.status !== "open") {
            throw new Error("issue is not open yet")
        }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (payload.title) {
        values.push(payload.title);
        updates.push(`title = $${values.length}`);
    }

    if (payload.description) {
        values.push(payload.description);
        updates.push(`description = $${values.length}`);
    }

    if (payload.type) {
        values.push(payload.type);
        updates.push(`type = $${values.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(issueId);

    const query = `
        UPDATE issues
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
      `;

    const result = await pool.query(query, values);
    // const result = await pool.query(`
    // UPDATE issues 
    // SET ${updates.join(",")}
    // `, [])

    return result.rows[0];
};

const deleteIssueFromDB = async(role:string, id:number) => {
    if(role !== 'maintainer'){
        throw new Error("unauthorized access");
    }
    const result = await pool.query(`
            DELETE FROM issues WHERE id=$1
        `,[id]);
}

export const issuesService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueInDB,
    deleteIssueFromDB
}