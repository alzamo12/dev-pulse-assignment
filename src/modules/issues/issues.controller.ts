import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import { sendResponse } from "../../utils/sendResponse/sendResponse";

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

const getAllIssues = async (req: Request, res: Response) => {
    try {
        const { sort = "newest", type, status } = req.query;

        const result = await issuesService.getAllIssuesFromDB({
            sort: sort as 'newest' | 'oldest',
            type: type as 'bug' | 'feature_request',
            status: status as 'open' | 'in_progress' | 'resolved'
        });
        sendResponse(res, 200, true, 'Issues retrieved successfully', result)
    } catch (err: any) {
        sendResponse(res, 500, false, err.message, err)
    }
}

export const issuesController = {
    createIssue,
    getAllIssues
};