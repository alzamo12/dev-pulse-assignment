import { pool } from "../../db";

const createIssueIntoDB = async(payload:any)=>{
    const result = await pool.query( `
        
        `,[]);
        return result
};

export const issuesService = {
    createIssueIntoDB
}