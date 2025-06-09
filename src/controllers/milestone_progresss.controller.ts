import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { milestoneProgress, milestoneProgressUpdateSchema } from "../validations/milestone_progress.validation";
import { Request, Response, NextFunction } from 'express';
import dispatcher from "../utils/dispatch.util";
import db from "../utils/dbconnection.util";
import { QueryTypes } from "sequelize";
import { S3 } from "aws-sdk";
import { speeches } from "../configs/speeches.config";
import fs from 'fs';
import { Op } from "sequelize";
import { milestone_progress } from "../models/milestone_progress.model";


export default class MilestoneProgressController extends BaseController {
    model = "milestone_progress";
    protected initializePath(): void {
        this.path = "/milestone_progress";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(milestoneProgress, milestoneProgressUpdateSchema);
    };
    protected initializeRoutes(): void {
        this.router.get(`${this.path}/milestoneQuestion`, this.getmilestoneQuestion.bind(this));
        this.router.post(`${this.path}/milestoneFileUpload`, this.handleAttachment.bind(this));
        super.initializeRoutes();
    };
    //get all Milestone Questions
    private async getmilestoneQuestion(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP' && res.locals.role !== 'STUDENT') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const result = await db.query(`SELECT * FROM milestones;`, { type: QueryTypes.SELECT });
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //storing files in the s3 bucket
    protected async handleAttachment(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const rawfiles: any = req.files;
            const files: any = Object.values(rawfiles);
            const allowedTypes = ['image/jpeg', 'image/png', 'application/msword', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(files[0].type)) {
                return res.status(400).send(dispatcher(res, '', 'error', 'This file type not allowed', 400));
            }
            const errs: any = [];
            let attachments: any = [];
            let result: any = {};
            let s3 = new S3({
                apiVersion: '2006-03-01',
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });
            if (!req.files) {
                return result;
            }
            let file_name_prefix: any;
            if (process.env.DB_HOST?.includes("prod")) {
                file_name_prefix = `milestone`
            } else if (process.env.DB_HOST?.includes("dev")) {
                file_name_prefix = `milestone/dev`
            } else {
                file_name_prefix = `milestone/stage`
            }
            for (const file_name of Object.keys(files)) {
                const file = files[file_name];
                const readFile: any = await fs.readFileSync(file.path);
                if (readFile instanceof Error) {
                    errs.push(`Error uploading file: ${file.originalFilename} err: ${readFile}`)
                }
                file.originalFilename = `${file_name_prefix}/${file.originalFilename}`;
                let params = {
                    Bucket: `${process.env.BUCKET}`,
                    Key: file.originalFilename,
                    Body: readFile
                };
                let options: any = { partSize: 20 * 1024 * 1024, queueSize: 2 };
                await s3.upload(params, options).promise()
                    .then((data: any) => { attachments.push(data.Location) })
                    .catch((err: any) => { errs.push(`Error uploading file: ${file.originalFilename}, err: ${err.message}`) })
                result['attachments'] = attachments;
                result['errors'] = errs;
            }
            res.status(200).send(dispatcher(res, result));
        } catch (err) {
            next(err)
        }
    }
    //Fetching milestone_progress of a team
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
            const data = await this.crudService.findAll(milestone_progress, {
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
};