import { Request, Response, NextFunction } from 'express';
import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import { user } from '../models/user.model';
import { badRequest, notFound, unauthorized } from 'boom';
import { mentorship } from '../models/mentorship.model';
import { Op, QueryTypes } from 'sequelize';
import { mentorshipSchema, mentorshipUpdateSchema } from '../validations/mentorship.validationa';
import validationMiddleware from '../middlewares/validation.middleware';
import bcrypt from 'bcrypt';
import { baseConfig } from '../configs/base.config';
import db from "../utils/dbconnection.util";

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
        this.router.post(`${this.path}/emailOtp`, this.emailOtp.bind(this));
        this.router.post(`${this.path}/triggerWelcomeEmail`, this.triggerWelcomeEmail.bind(this));
        this.router.put(`${this.path}/resetPassword`, this.resetPassword.bind(this));
        this.router.put(`${this.path}/forgotPassword`, this.forgotPassword.bind(this));
        this.router.get(`${this.path}/seletedteams`, this.getseletedteams.bind(this));
        super.initializeRoutes();
    }
    //Creating mentorship users
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (!req.body.password || req.body.password === "") req.body.password = await this.authService.generateCryptEncryption(req.body.mobile);
        req.body.role = 'MENTORSHIP';
        req.body.status = "INACTIVE";
        const MS_res = await this.crudService.findOne(mentorship, { where: { mobile: req.body.mobile } });
        if (MS_res) {
            return res.status(406).send(dispatcher(res, MS_res.dataValues, 'error', speeches.MENTOR_EXISTS_MOBILE, 406));
        }
        const payload = this.autoFillTrackingColumns(req, res, mentorship);
        const result = await this.authService.register(payload);
        if (result.user_res) return res.status(406).send(dispatcher(res, result.user_res.dataValues, 'error', speeches.MENTOR_EXISTS, 406));
        return res.status(201).send(dispatcher(res, result.profile.dataValues, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    }
    //fetching details of mentorship users
    protected async getData(req: Request, res: Response, next: NextFunction) {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any;
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const where: any = {};
            if (id) {
                const deValue: any = await this.authService.decryptGlobal(req.params.id);
                where[`${this.model}_id`] = JSON.parse(deValue);
                data = await this.crudService.findOne(modelClass, {
                    attributes: [
                        "mentorship_id", "areas_of_expertise", "mobile", "status", "college_name", "chatbox"
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
            } else if (newREQQuery.qtype === 'names') {
                data = await this.crudService.findAll(modelClass, {
                    attributes: [
                        "user_id", "full_name",
                        [
                            db.literal(`(select count(challenge_response_id) as MSteamCount from challenge_responses where mentorship_user_id = \`mentorship\`.\`user_id\` )`), 'teamCount'
                        ]
                    ],

                    where: {
                        status: 'ACTIVE'
                    },
                })
            }
            else {
                data = await this.crudService.findAll(modelClass, {
                    attributes: [
                        "mentorship_id", "areas_of_expertise", "mobile", "status", "college_name", "chatbox",
                        [
                            db.literal(`(select count(challenge_response_id) as MSteamCount from challenge_responses where mentorship_user_id = \`mentorship\`.\`user_id\` )`), 'teamCount'
                        ]
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
                    throw notFound(data.message);
                } else {
                    throw notFound()
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        }
        catch (err) {
            next(err);
        }
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
            result.data['chatbox'] = MentorshipDetails.dataValues.chatbox;
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
            const { model } = req.params;
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
    //sending otp to user at the time of registration
    private async emailOtp(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { username } = req.body;
            if (!username) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            const result = await this.authService.emailotp(req.body, mentorship);
            if (result.error) {
                if (result && result.error.output && result.error.output.payload && result.error.output.payload.message == 'Email') {
                    return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS, 406));
                } else if (result && result.error.output && result.error.output.payload && result.error.output.payload.message == 'Mobile') {
                    return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS_MOBILE, 406));
                }
                else {
                    return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
                }
            } else {
                return res.status(202).send(dispatcher(res, result.data, 'accepted', speeches.OTP_SEND_EMAIL, 202));
            }
        } catch (error) {
            next(error)
        }
    }
    //after successfully mentorShip registation welcome is send to user
    protected async triggerWelcomeEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await this.authService.triggerWelcome(req.body, 'Mentor', '');
            return res.status(200).send(dispatcher(res, result, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //reseting mentorShip password to default 
    private async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const MS_res = await this.crudService.findOne(mentorship, { where: { user_id: req.body.user_id } });
            if (!MS_res) {
                return res.status(406).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND, 404));
            }
            let hashString = await this.authService.generateCryptEncryption(MS_res.dataValues.mobile)
            const result: any = await this.crudService.update(user, {
                password: await bcrypt.hashSync(hashString, process.env.SALT || baseConfig.SALT)
            }, { where: { user_id: req.body.user_id } })
            if (result.error) {
                return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
            } else {
                return res.status(202).send(dispatcher(res, result, 'accepted', speeches.DEFAULTPASSWORD, 202));
            }
        } catch (error) {
            next(error)
        }
    }
    //Sending temp password to mentorShip email
    private async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { email, role } = req.body;
            if (!email) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            if (!role) {
                throw badRequest(speeches.USER_ROLE_REQUIRED);
            }
            const result = await this.authService.MentorShipForgotPassword(req.body);
            if (!result) {
                return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
            } else if (result.error) {
                return res.status(404).send(dispatcher(res, result.error, 'error', result.error));
            } else {
                return res.status(202).send(dispatcher(res, result.data, 'accepted', speeches.USER_PASS_UPDATE, 202));
            }
        } catch (error) {
            next(error)
        }
    }
    //fecting team which are assign to mentor
    protected async getseletedteams(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTORSHIP') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const { user_id } = newREQQuery
            result = await db.query(`select challenge_response_id,student_id from challenge_responses where mentorship_user_id = ${user_id}`, { type: QueryTypes.SELECT });
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
};