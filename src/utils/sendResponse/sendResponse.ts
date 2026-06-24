import type { Response } from "express"

interface IResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: any;

}

export const sendResponse = (res: Response, status: number, success: boolean, message: string, data?: any) => {
    const response: IResponse = {
        success,
        message,
    };

    if (success) {
        response.data = data
    }
    else {
        response.error = data
    };

    res.status(status).send(response)
}