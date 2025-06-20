import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { schedule_calladd, schedule_callUpdateSchema } from "../validations/schedule_call.validation";
import { Request, Response, NextFunction } from 'express';
import dispatcher from "../utils/dispatch.util";
import { speeches } from "../configs/speeches.config";
import { schedule_call } from "../models/schedule_call.model";
import { Op } from "sequelize";

export default class ScheduleCallsController extends BaseController {

    model = "schedule_call";

    protected initializePath(): void {
        this.path = '/schedule_calls';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(schedule_calladd, schedule_callUpdateSchema);
    }
    protected initializeRoutes(): void {
        super.initializeRoutes();
    }
    //Fetching schedule_call of a team
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'STATE' && res.locals.role !== 'MENTORSHIP') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const data = await this.crudService.findAll(schedule_call, {
                where: {
                    [Op.and]: [
                        { challenge_response_id: newREQQuery.challenge_response_id }
                    ]
                }
            });

            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
} 
