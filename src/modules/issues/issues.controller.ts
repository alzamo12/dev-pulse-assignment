import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
    try {
        // const result = await issuesService.createIssueIntoDB(req.body);
        res.send({ success: true })
    } catch (err: any) {
        console.log(err)
        res.status(500).send({
            success: true,
            message: err.message,
            error: err
        })
    }
};

export const issuesController = {
    createIssue
};