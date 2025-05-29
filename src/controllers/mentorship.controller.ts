import { Request, Response, NextFunction } from 'express';
import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import { user } from '../models/user.model';
import { badRequest, notFound, unauthorized } from 'boom';
import { mentorship } from '../models/mentorship.model';
import { Op } from 'sequelize';
import { mentorshipSchema, mentorshipUpdateSchema } from '../validations/mentorship.validationa';
import validationMiddleware from '../middlewares/validation.middleware';

export default class MentorshipController extends BaseController {
    model = "mentorship";
    authService: authService = new authService;

    protected initializePath(): void {
        this.path = '/mentorships';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(mentorshipSchema, mentorshipUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/register`, validationMiddleware(mentorshipSchema), this.register.bind(this));
        this.router.post(`${this.path}/login`, this.login.bind(this));
        this.router.get(`${this.path}/logout`, this.logout.bind(this));
        this.router.put(`${this.path}/changePassword`, this.changePassword.bind(this));
        super.initializeRoutes();
    }
    //Creating mentorship users
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (!req.body.password || req.body.password === "") req.body.password = await this.authService.generateCryptEncryption(req.body.mobile);
        req.body.role = 'MENTORSHIP';
        const payload = this.autoFillTrackingColumns(req, res, mentorship);
        const result = await this.authService.register(payload);
        if (result.user_res) return res.status(406).send(dispatcher(res, result.user_res.dataValues, 'error', speeches.MENTORSHIP_EXISTS, 406));
        return res.status(201).send(dispatcher(res, result.profile.dataValues, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    }
    //fetching details of mentorship users
    protected async getData(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
            throw unauthorized(speeches.ROLE_ACCES_DECLINE)
        }
        let data: any;
        const { model, id } = req.params;
        if (model) {
            this.model = model;
        };
        const modelClass = await this.loadModel(model).catch(error => {
            next(error)
        });
        const where: any = {};
        if (id) {
            const deValue: any = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = JSON.parse(deValue);
            data = await this.crudService.findOne(modelClass, {
                attributes: [
                    "mentorship_id", "areas_of_expertise", "mobile", "status",
                ],
                where: {
                    [Op.and]: [
                        where
                    ]
                },
                include: {
                    model: user,
                    attributes: [
                        "user_id",
                        "username",
                        "full_name"
                    ]
                }
            })
        } else {
            data = await this.crudService.findAll(modelClass, {
                attributes: [
                    "mentorship_id", "areas_of_expertise", "mobile", "status",
                ],
                include: {
                    model: user,
                    attributes: [
                        "user_id",
                        "username",
                        "full_name"
                    ]
                }
            })
        }
        if (!data || data instanceof Error) {
            if (data != null) {
                throw notFound(data.message)
            } else {
                throw notFound()
            }
        }
        return res.status(200).send(dispatcher(res, data, 'success'));
    }
    //updating details of mentorship users with the mentorship id
    protected async updateData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model } = req.params;
            if (model) {
                this.model = model;
            };
            const where: any = {};
            const newParamId = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = newParamId;
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded)
            const findMentorshipDetail = await this.crudService.findOne(modelLoaded, { where: where });
            if (!findMentorshipDetail || findMentorshipDetail instanceof Error) {
                throw notFound();
            } else {
                const mentorshipData = await this.crudService.update(modelLoaded, payload, { where: where });
                const userData = await this.crudService.update(user, payload, { where: { user_id: findMentorshipDetail.dataValues.user_id } });
                if (!mentorshipData || !userData) {
                    throw badRequest()
                }
                if (mentorshipData instanceof Error) {
                    throw mentorshipData;
                }
                if (userData instanceof Error) {
                    throw userData;
                }
                const data = { userData, mentorshipData };
                return res.status(200).send(dispatcher(res, data, 'updated'));
            }
        } catch (error) {
            next(error);
        }
    }
    //login api for the mentorship users 
    //Input username and password
    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        req.body['role'] = 'MENTORSHIP'
        const result = await this.authService.login(req.body);
        if (!result) {
            return res.status(404).send(dispatcher(res, result, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(401).send(dispatcher(res, result.error, 'error', speeches.USER_RISTRICTED, 401));
        } else {
            const MentorshipDetails = await this.crudService.findOne(mentorship, { where: { user_id: result.data.user_id } });
            if (!MentorshipDetails || MentorshipDetails instanceof Error) {
                return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_REG_STATUS));
            }
            result.data['mentorship_id'] = MentorshipDetails.dataValues.mentorship_id;
            return res.status(200).send(dispatcher(res, result.data, 'success', speeches.USER_LOGIN_SUCCESS));
        }
    }
    //logout api for the mentorship users 
    private async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.logout(req.body, res);
        if (result.error) {
            next(result.error);
        } else {
            return res.status(200).send(dispatcher(res, speeches.LOGOUT_SUCCESS, 'success'));
        }
    }
    //change password for mentorship
    private async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        const result = await this.authService.changePassword(req.body, res);
        if (!result) {
            return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
        }
        else if (result.match) {
            return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_PASSWORD));
        } else {
            return res.status(202).send(dispatcher(res, result.data, 'accepted', speeches.USER_PASSWORD_CHANGE, 202));
        }
    }
    //Deleting mentorship details by mentorship_id
    protected async deleteData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
            if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
                return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
            }
            try {
                const { model} = req.params;
                if (model) this.model = model;
                const where: any = {};
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`${this.model}_id`] = newParamId;
                const getUserIdFromMentorshipData = await this.crudService.findOne(mentorship, { where: { mentorship_id: where.mentorship_id } });
                if (!getUserIdFromMentorshipData) throw notFound(speeches.USER_NOT_FOUND);
                if (getUserIdFromMentorshipData instanceof Error) throw getUserIdFromMentorshipData;
                const user_id = getUserIdFromMentorshipData.dataValues.user_id;
                await this.crudService.delete(user, { where: { user_id: user_id } })
                const data = await this.crudService.delete(mentorship, { where: { mentorship_id: where.mentorship_id } })
                return res.status(200).send(dispatcher(res, data, 'deleted'));
            } catch (error) {
                next(error);
            }
        }
};