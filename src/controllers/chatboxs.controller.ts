import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { chatboxs, chatboxsUpdateSchema } from "../validations/chatboxs.validation";
import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { speeches } from "../configs/speeches.config";
import dispatcher from "../utils/dispatch.util";
import { chatbox_replie } from "../models/chatbox_replie.model";
import db from "../utils/dbconnection.util";
import { notFound } from "boom";


export default class ChatboxsController extends BaseController {
    model = "chatbox";
    protected initializePath(): void {
        this.path = "/chatboxs";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(chatboxs, chatboxsUpdateSchema);
    };
    protected initializeRoutes(): void {
        super.initializeRoutes();
    };

    //fetching all chatbox details and single chatbox by chatbox_id
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP' && res.locals.role !== 'STUDENT') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any;
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const { user_id } = newREQQuery;
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            const where: any = {};
            if (id) {
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`${this.model}_id`] = newParamId;
                data = await this.crudService.findOne(modelClass, {
                    where: {
                        [Op.and]: [
                            where
                        ]
                    },
                    include: {
                        attributes: [
                            "chatbox_replie_id",
                            "reply_details",
                            "created_at",
                            "updated_at",
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`chatbox_replies\`.\`created_by\` )`), 'created_by'
                            ],
                            [
                                db.literal(`(SELECT full_name FROM users As s WHERE s.user_id = \`chatbox_replies\`.\`updated_by\` )`), 'updated_by'
                            ],
                        ],
                        model: chatbox_replie,
                        required: false
                    }
                });
            } else {
                console.log(user_id, modelClass);
                data = await this.crudService.findAll(modelClass, {
                    where: {
                        [Op.and]: [
                            { mentorship_user_id: user_id }
                        ]
                    }
                })
            }
            if (!data || data instanceof Error) {
                throw notFound(data.message);
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    };

};