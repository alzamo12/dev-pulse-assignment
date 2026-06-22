import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
    try {
        const result = await issuesService.createIssueIntoDB(req.body, req?.user?.id);
        // console.log(req.user)
        res.status(201).send({
            success: true,
            message: "Issue created successfully",
            data: result
        })
    } catch (err: any) {
        console.log(err)
        res.status(500).send({
            success: false,
            message: err.message,
            error: err
        })
    }
};

export const issuesController = {
    createIssue
};