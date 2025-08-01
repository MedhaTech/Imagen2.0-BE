import { Op, QueryTypes } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { speeches } from '../configs/speeches.config';
import { baseConfig } from '../configs/base.config';
import { user } from '../models/user.model';
import db from "../utils/dbconnection.util"
import { mentorSchema, mentorUpdateSchema } from '../validations/mentor.validationa';
import dispatcher from '../utils/dispatch.util';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import { badRequest, notFound } from 'boom';
import { mentor } from '../models/mentor.model';
import { constents } from '../configs/constents.config';
import { organization } from '../models/organization.model';
import validationMiddleware from '../middlewares/validation.middleware';
import { badge } from '../models/badge.model';

export default class MentorController extends BaseController {
    model = "mentor";
    authService: authService = new authService;
    protected initializePath(): void {
        this.path = '/mentors';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(mentorSchema, mentorUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/register`, validationMiddleware(mentorSchema), this.register.bind(this));
        this.router.post(`${this.path}/login`, this.login.bind(this));
        this.router.get(`${this.path}/logout`, this.logout.bind(this));
        this.router.put(`${this.path}/changePassword`, this.changePassword.bind(this));
        this.router.put(`${this.path}/resetPassword`, this.resetPassword.bind(this));
        this.router.post(`${this.path}/emailOtp`, this.emailOtp.bind(this));
        this.router.get(`${this.path}/mentorpdfdata`, this.mentorpdfdata.bind(this));
        this.router.post(`${this.path}/triggerWelcomeEmail`, this.triggerWelcomeEmail.bind(this));
        this.router.post(`${this.path}/:mentor_user_id/badges`, this.addBadgeToMentor.bind(this));
        this.router.get(`${this.path}/:mentor_user_id/badges`, this.getMentorBadges.bind(this));
        this.router.get(`${this.path}/teamCredentials/:mentorId`, this.getteamCredentials.bind(this));
        this.router.get(`${this.path}/pilotNameByInstName`, this.getNameByInst.bind(this));

        super.initializeRoutes();
    }
    //fetching Institution all details 
    //Single Institution details by mentor id
    //all Institution list
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any;
            const { model, id } = req.params;
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const paramStatus: any = newREQQuery.status;
            if (model) {
                this.model = model;
            };
            // pagination
            const { page, size, status } = newREQQuery;
            const { limit, offset } = this.getPagination(page, size);
            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            const where: any = {};
            let whereClauseStatusPart: any = {};
            let boolStatusWhereClauseRequired = false;
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                if (paramStatus === 'ALL') {
                    whereClauseStatusPart = {};
                    boolStatusWhereClauseRequired = false;
                } else {
                    whereClauseStatusPart = { "status": paramStatus };
                    boolStatusWhereClauseRequired = true;
                }
            } else {
                whereClauseStatusPart = { "status": "ACTIVE" };
                boolStatusWhereClauseRequired = true;
            };

            let { district } = newREQQuery

            if (id) {
                const deValue: any = await this.authService.decryptGlobal(req.params.id);
                where[`${this.model}_id`] = JSON.parse(deValue);
                data = await this.crudService.findOne(modelClass, {
                    attributes: {
                        include: [
                            [
                                db.literal(`( SELECT username FROM users AS u WHERE u.user_id = \`mentor\`.\`user_id\`)`), 'username_email'
                            ]
                        ]
                    },
                    where: {
                        [Op.and]: [
                            whereClauseStatusPart,
                            where,
                        ]
                    }
                });
            } else {
                try {
                    if (district !== 'All Districts' && typeof district == 'string') {
                        where[`district`] = district;
                    }
                    const responseOfFindAndCountAll = await this.crudService.findAndCountAll(modelClass, {
                        attributes: {
                            include: [
                                [
                                    db.literal(`( SELECT username FROM users AS u WHERE u.user_id = \`mentor\`.\`user_id\`)`), 'username_email'
                                ]
                            ]
                        },
                        where: {
                            [Op.and]: [
                                where
                            ]
                        }
                    });
                    const result = this.getPagingData(responseOfFindAndCountAll, page, limit);
                    data = result;
                } catch (error: any) {
                    return res.status(500).send(dispatcher(res, data, 'error'))
                }

            }

            if (!data || data instanceof Error) {
                if (data != null) {
                    throw notFound(data.message)
                } else {
                    throw notFound()
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //updating the Institution data by mentor id
    protected async updateData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            const user_id = res.locals.user_id
            const where: any = {};
            const newParamId = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = newParamId;
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded)
            const findMentorDetail = await this.crudService.findOne(modelLoaded, { where: where });
            if (!findMentorDetail || findMentorDetail instanceof Error) {
                throw notFound();
            } else {
                const mentorData = await this.crudService.update(modelLoaded, payload, { where: where });
                const userData = await this.crudService.update(user, payload, { where: { user_id: findMentorDetail.dataValues.user_id } });
                if (!mentorData || !userData) {
                    throw badRequest()
                }
                if (mentorData instanceof Error) {
                    throw mentorData;
                }
                if (userData instanceof Error) {
                    throw userData;
                }
                const data = { userData, mentor };
                return res.status(200).send(dispatcher(res, data, 'updated'));
            }
        } catch (error) {
            next(error);
        }
    }
    //creating the Institution users
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        req.body['role'] = 'MENTOR';
        req.body.password = req.body.confirmPassword
        const checkmentor = await this.crudService.findAndCountAll(mentor, {
            where: {
                college_name: req.body.college_name,
                college_type: req.body.college_type,
                district: req.body.district
            }
        });
        if (checkmentor.count >= 2) {
            return res.status(400).send(dispatcher(res, '', 'error', 'A user from this institution has already been registered. Maximum registration limit reached.', 400));
        }
        const payloadData = this.autoFillTrackingColumns(req, res, mentor);
        const result: any = await this.authService.mentorRegister(payloadData);
        if (result && result.output && result.output.payload && result.output.payload.message == 'Email') {
            return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS, 406));
        }
        if (result && result.output && result.output.payload && result.output.payload.message == 'Mobile') {
            return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS_MOBILE, 406));
        }
        const data = result.dataValues;
        return res.status(201).send(dispatcher(res, data, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    }
    //Deleting Institution details by mentor_id
    protected async deleteData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) this.model = model;
            const where: any = {};
            const newParamId = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = newParamId;
            const getUserIdFromMentorData = await this.crudService.findOne(mentor, { where: { mentor_id: where.mentor_id } });
            if (!getUserIdFromMentorData) throw notFound(speeches.USER_NOT_FOUND);
            if (getUserIdFromMentorData instanceof Error) throw getUserIdFromMentorData;
            const user_id = getUserIdFromMentorData.dataValues.user_id;
            await this.crudService.delete(user, { where: { user_id: user_id } })
            const data = await this.crudService.delete(mentor, { where: { mentor_id: where.mentor_id } })
            return res.status(200).send(dispatcher(res, data, 'deleted'));
        } catch (error) {
            next(error);
        }
    }
    //login api for the Institution users 
    //Input username and password
    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        req.body['role'] = 'MENTOR'
        try {
            const result = await this.authService.login(req.body);

            if (!result) {
                return res.status(404).send(dispatcher(res, result, 'error', speeches.USER_NOT_FOUND));
            }
            else {
                const mentorData = await this.authService.crudService.findOne(mentor, {
                    where: { user_id: result.data.user_id }
                });
                result.data['mentor_id'] = mentorData.dataValues.mentor_id;
                result.data['college_name'] = mentorData.dataValues.college_name;
                result.data['college_type'] = mentorData.dataValues.college_type;
                result.data['district'] = mentorData.dataValues.district;
                return res.status(200).send(dispatcher(res, result.data, 'success', speeches.USER_LOGIN_SUCCESS));
            }
        } catch (error) {
            return res.status(401).send(dispatcher(res, error, 'error', speeches.USER_RISTRICTED, 401));
        }
    }
    //logout api for the Institution users
    private async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const result = await this.authService.logout(req.body, res);
        if (result.error) {
            next(result.error);
        } else {
            return res.status(200).send(dispatcher(res, speeches.LOGOUT_SUCCESS, 'success'));
        }
    }
    //change password for Institution
    private async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
    //sending otp to user at the time of registration
    private async emailOtp(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { username } = req.body;
            if (!username) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            const checkmentor = await this.crudService.findAndCountAll(mentor, {
                where: {
                    college_name: req.body.college_name,
                    college_type: req.body.college_type,
                    district: req.body.district
                }
            });
            if (checkmentor.count >= 2) {
                return res.status(400).send(dispatcher(res, '', 'error', 'A user from this institution has already been registered. Maximum registration limit reached.', 400));
            }
            const result = await this.authService.emailotp(req.body, mentor);
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
    //reseting Institution password to default 
    private async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { email, role } = req.body;
            if (!email) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            if (!role) {
                throw badRequest(speeches.USER_ROLE_REQUIRED);
            }
            const result = await this.authService.mentorResetPassword(req.body);
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
    //fetching Institution details for the pdf genetating 
    protected async mentorpdfdata(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {};
            const { model } = req.params;
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const id = newREQQuery.id;
            const user_id = newREQQuery.user_id;
            const paramStatus: any = newREQQuery.status;
            if (model) {
                this.model = model;
            };

            const modelClass = await this.loadModel(model).catch(error => {
                next(error)
            });
            const where: any = {};
            let whereClauseStatusPart: any = {};
            let boolStatusWhereClauseRequired = false;
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                if (paramStatus === 'ALL') {
                    whereClauseStatusPart = {};
                    boolStatusWhereClauseRequired = false;
                } else {
                    whereClauseStatusPart = { "status": paramStatus };
                    boolStatusWhereClauseRequired = true;
                }
            } else {
                whereClauseStatusPart = { "status": "ACTIVE" };
                boolStatusWhereClauseRequired = true;
            };
            where[`mentor_id`] = id;
            data['mentorData'] = await this.crudService.findOne(modelClass, {
                where: {
                    [Op.and]: [
                        whereClauseStatusPart,
                        where,
                    ]
                },
                attributes: ['mentor_id',
                    "user_id",
                    "full_name",
                    "mobile"],
                include: [

                    {
                        model: organization,
                        attributes: [
                            "organization_code",
                            "organization_name",
                            "state",
                            "district",
                            "category"
                        ]
                    },
                    {
                        model: user,
                        attributes: [
                            "username"
                        ]
                    }

                ],
            });
            const currentProgress = await db.query(`SELECT count(*)as currentValue FROM mentor_topic_progress where user_id = ${user_id}`, { type: QueryTypes.SELECT })
            data['currentProgress'] = Object.values(currentProgress[0]).toString();
            data['totalProgress'] = baseConfig.MENTOR_COURSE
            data['teamsCount'] = await db.query(`SELECT count(*) as teams_count FROM teams where mentor_id = ${id}`, { type: QueryTypes.SELECT });
            data['studentCount'] = await db.query(`SELECT count(*) as student_count FROM students join teams on students.team_id = teams.team_id  where mentor_id = ${id};`, { type: QueryTypes.SELECT });
            if (!data || data instanceof Error) {
                if (data != null) {
                    throw notFound(data.message)
                } else {
                    throw notFound()
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //after successfully Institution registation welcome is send to user
    protected async triggerWelcomeEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const result = await this.authService.triggerWelcome(req.body, 'Institution User', '');
            return res.status(200).send(dispatcher(res, result, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //Adding badges for the mentor on business conditions
    private async addBadgeToMentor(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {

            const mentor_user_id: any = await this.authService.decryptGlobal(req.params.mentor_user_id);
            const badges_ids: any = req.body.badge_ids;
            const badges_slugs: any = req.body.badge_slugs;
            let areSlugsBeingUsed = true;
            if (!badges_slugs || !badges_slugs.length || badges_slugs.length <= 0) {
                areSlugsBeingUsed = false;
            }

            if (!areSlugsBeingUsed && (!badges_ids || !badges_ids.length || badges_ids.length <= 0)) {
                throw badRequest(speeches.BADGE_IDS_ARRAY_REQUIRED)
            }

            let mentorBadgesObj: any = await this.authService.getMentorBadges(mentor_user_id);
            if (mentorBadgesObj instanceof Error) {
                throw mentorBadgesObj
            }
            if (!mentorBadgesObj) {
                mentorBadgesObj = {};
            }
            const errors: any = []

            let forLoopArr = badges_slugs;

            if (!areSlugsBeingUsed) {
                forLoopArr = badges_ids
            }

            for (var i = 0; i < forLoopArr.length; i++) {
                let badgeId = forLoopArr[i];
                let badgeFindWhereClause: any = {
                    slug: badgeId
                }
                if (!areSlugsBeingUsed) {
                    badgeFindWhereClause = {
                        badge_id: badgeId
                    }
                }
                const badgeResultForId = await this.crudService.findOne(badge, { where: badgeFindWhereClause })
                if (!badgeResultForId) {
                    errors.push({ id: badgeId, err: badRequest(speeches.DATA_NOT_FOUND) })
                    continue;
                }
                if (badgeResultForId instanceof Error) {
                    errors.push({ id: badgeId, err: badgeResultForId })
                    continue;
                }

                const mentorHasBadgeObjForId = mentorBadgesObj[badgeResultForId.dataValues.slug]
                if (!mentorHasBadgeObjForId || !mentorHasBadgeObjForId.completed_date) {
                    mentorBadgesObj[badgeResultForId.dataValues.slug] = {
                        completed_date: (new Date())
                    }
                }
            }
            const mentorBadgesObjJson = JSON.stringify(mentorBadgesObj)
            const result: any = await mentor.update({ badges: mentorBadgesObjJson }, {
                where: {
                    user_id: mentor_user_id
                }
            })
            if (result instanceof Error) {
                throw result;
            }

            if (!result) {
                return res.status(404).send(dispatcher(res, null, 'error', speeches.USER_NOT_FOUND));
            }
            let dispatchStatus = "updated"
            let resStatus = 202
            let dispatchStatusMsg = speeches.USER_BADGES_LINKED
            if (errors && errors.length > 0) {
                dispatchStatus = "error"
                dispatchStatusMsg = "error"
                resStatus = 400
            }

            return res.status(resStatus).send(dispatcher(res, { errs: errors, success: mentorBadgesObj }, dispatchStatus, dispatchStatusMsg, resStatus));
        } catch (err) {
            next(err)
        }
    }
    //Fetching mentor badges
    private async getMentorBadges(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const mentor_user_id: any = await this.authService.decryptGlobal(req.params.mentor_user_id);
            let mentorBadgesObj: any = await this.authService.getMentorBadges(mentor_user_id);
            if (mentorBadgesObj instanceof Error) {
                throw mentorBadgesObj
            }
            if (!mentorBadgesObj) {
                mentorBadgesObj = {};
            }
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const paramStatus: any = newREQQuery.status;
            const where: any = {};
            let whereClauseStatusPart: any = {};
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
            }
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
            }
            where['role'] = 'mentor';
            const allBadgesResult = await badge.findAll({
                where: {
                    [Op.and]: [
                        whereClauseStatusPart,
                        where,
                    ]
                },
                raw: true,
            });

            if (!allBadgesResult) {
                throw notFound(speeches.DATA_NOT_FOUND);
            }
            if (allBadgesResult instanceof Error) {
                throw allBadgesResult;
            }
            for (var i = 0; i < allBadgesResult.length; i++) {
                const currBadge: any = allBadgesResult[i];
                if (mentorBadgesObj.hasOwnProperty("" + currBadge.slug)) {
                    currBadge["mentor_status"] = mentorBadgesObj[("" + currBadge.slug)].completed_date
                } else {
                    currBadge["mentor_status"] = null;
                }
                allBadgesResult[i] = currBadge
            }

            return res.status(200).send(dispatcher(res, allBadgesResult, 'success'));
        } catch (err) {
            next(err)
        }
    }
    //fetching team details of the Institution
    protected async getteamCredentials(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};
            const deValue: any = await this.authService.decryptGlobal(req.params.mentorId);
            if (req.params.mentorId) {
                result = await db.query(`SELECT teams.team_id,team_name,(SELECT username FROM users WHERE user_id = teams.user_id) AS username FROM teams WHERE mentor_id = ${deValue} GROUP BY teams.team_id ORDER BY team_id DESC`, { type: QueryTypes.SELECT });
            }
            return res.status(200).send(dispatcher(res, result, 'success'));
        }
        catch (err) {
            next(err)
        }
    }
    //Fetching student details by the college name
    protected async getNameByInst(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
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
            const college_name = newREQQuery.college_name;
            const result = await db.query(`SELECT 
    full_name, student_id
FROM
    students
WHERE
    type = 0
        AND college_name = '${college_name}';`, { type: QueryTypes.SELECT });
            res.status(200).send(dispatcher(res, result, "success"))
        } catch (error) {
            next(error);
        }
    }
};

