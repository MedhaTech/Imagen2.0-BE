import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { speeches } from "../configs/speeches.config";
import dispatcher from "../utils/dispatch.util";
import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import db from "../utils/dbconnection.util";
import { badRequest } from "boom";
import { S3 } from "aws-sdk";
import fs from 'fs';
import { discussionForums, discussionForumsUpdateSchema } from "../validations/discussionForum.validation";
import { discussion_forum_reply } from "../models/discussion_forum_reply.model";


export default class DiscussionForumController extends BaseController {

    model = "discussion_forum"

    protected initializePath(): void {
        this.path = "/discussionForums";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(discussionForums, discussionForumsUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/discussionForumFileUpload`, this.handleAttachment.bind(this));
        super.initializeRoutes();
    }
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any;
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            // pagination
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const { page, size, status, user_id, district } = newREQQuery;
            let condition = status ? { status: { [Op.like]: `%${status}%` } } : null;
            let districtFilter = district ? { district: { [Op.like]: `%${district}%` } } : null;
            let filteringBasedOnUser_id = user_id ? { created_by: user_id } : null;
            const { limit, offset } = this.getPagination(page, size);
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            const where: any = {};
            if (id) {
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`${this.model}_id`] = newParamId;
                data = await this.crudService.findOne(modelClass, {
                    attributes: [
                        [
                            db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum\`.\`created_by\` )`), 'created_by'
                        ],
                        [
                            db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum\`.\`updated_by\` )`), 'updated_by'
                        ],
                        [
                            db.literal(`( SELECT COUNT(*) FROM discussion_forum_replies AS s WHERE s.discussion_forum_id = \`discussion_forum\`.\`discussion_forum_id\`)`), 'replies_count'
                        ],
                        'discussion_forum_id',
                        'query_details',
                        "link",
                        "file",
                        'status',
                        'created_at',
                        'updated_at',
                        'district'
                    ],
                    where: {
                        [Op.and]: [
                            where
                        ]
                    },
                    include: {
                        attributes: [
                            "discussion_forum_reply_id",
                            "link",
                            "file",
                            "reply_details",
                            "status",
                            "created_at",
                            "updated_at",
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum_replies\`.\`created_by\` )`), 'created_by'
                            ],
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum_replies\`.\`updated_by\` )`), 'updated_by'
                            ],
                        ],
                        model: discussion_forum_reply,
                        required: false
                    }
                });
            } else {
                try {
                    const responseOfFindAndCountAll = await this.crudService.findAndCountAll(modelClass, {
                        attributes: [
                            'discussion_forum_id',
                            'query_details',
                            'status',
                            'created_at',
                            'updated_at',
                            "link",
                            "file",
                            'district',
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum\`.\`created_by\` )`), 'created_by'
                            ],
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`discussion_forum\`.\`updated_by\` )`), 'updated_by'
                            ],
                            [
                                db.literal(`( SELECT COUNT(*) FROM discussion_forum_replies AS s WHERE s.discussion_forum_id = \`discussion_forum\`.\`discussion_forum_id\`)`), 'replies_count'
                            ]
                        ],
                        where: {
                            [Op.and]: [
                                districtFilter,
                                condition,
                                filteringBasedOnUser_id
                            ]
                        },
                        limit, offset,
                        order: [["updated_at", "DESC"]],
                    })
                    const result = this.getPagingData(responseOfFindAndCountAll, page, limit);
                    data = result;
                } catch (error: any) {
                    return res.status(500).send(dispatcher(res, data, 'error'))
                }
            }
            if (!data || data instanceof Error) {
                res.status(200).send(dispatcher(res, null, "error", speeches.DATA_NOT_FOUND));
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    };
    protected async updateData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            const where: any = {};
            const user_id = res.locals.user_id
            const modelLoaded = await this.loadModel(model);
            let payload: any = req.body;
            payload['updated_by'] = user_id;
            const newParamId: any = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = JSON.parse(newParamId);
            const data = await this.crudService.update(modelLoaded, payload, { where: where });
            if (!data) {
                throw badRequest()
            }
            if (data instanceof Error) {
                throw data;
            }
            return res.status(200).send(dispatcher(res, data, 'updated'));
        } catch (error) {
            next(error);
        }
    }
    protected async handleAttachment(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STUDENT') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const user_id = res.locals.user_id
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
                file_name_prefix = `discussionForums/${user_id}`
            } else if (process.env.DB_HOST?.includes("dev")) {
                file_name_prefix = `discussionForums/dev/${user_id}`
            } else {
                file_name_prefix = `discussionForums/stage/${user_id}`
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
};