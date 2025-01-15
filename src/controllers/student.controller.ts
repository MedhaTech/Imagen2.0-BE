import { Request, Response, NextFunction } from 'express';
import { customAlphabet } from 'nanoid';
import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import { studentLoginSchema, studentSchema, studentSchemaAddstudent, studentUpdateSchema } from '../validations/student.validationa';
import bcrypt from 'bcrypt';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import validationMiddleware from '../middlewares/validation.middleware';
import { constents } from '../configs/constents.config';
import { Op, QueryTypes } from 'sequelize';
import { user } from '../models/user.model';
import { team } from '../models/team.model';
import { baseConfig } from '../configs/base.config';
import { student } from '../models/student.model';
import StudentService from '../services/students.service';
import { badge } from '../models/badge.model';
import { mentor } from '../models/mentor.model';
import { organization } from '../models/organization.model';
import { badRequest, internal, notFound } from 'boom';
import db from "../utils/dbconnection.util"

export default class StudentController extends BaseController {
    model = "student";
    authService: authService = new authService;
    private password = process.env.GLOBAL_PASSWORD;
    private nanoid = customAlphabet('0123456789', 6);

    protected initializePath(): void {
        this.path = '/students';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(studentSchema, studentUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/register`, validationMiddleware(studentSchema), this.register.bind(this));
        this.router.post(`${this.path}/addStudent`, validationMiddleware(studentSchemaAddstudent), this.addStudent.bind(this));
        // this.router.post(`${this.path}/bulkCreateStudent`, this.bulkCreateStudent.bind(this));
        this.router.get(`${this.path}/:student_user_id/studentCertificate`, this.studentCertificate.bind(this));
        this.router.post(`${this.path}/:student_user_id/badges`, this.addBadgeToStudent.bind(this));
        this.router.get(`${this.path}/:student_user_id/badges`, this.getStudentBadges.bind(this));
        this.router.post(`${this.path}/emailOtp`, this.emailOtp.bind(this));
        this.router.post(`${this.path}/login`, validationMiddleware(studentLoginSchema), this.login.bind(this));
        this.router.get(`${this.path}/ListOfPilotStudent`, this.getPilotStudent.bind(this));
        this.router.delete(`${this.path}/:student_id/deleteAllData`, this.deleteAllData.bind(this));
        this.router.put(`${this.path}/forgotPassword`, this.forgotPassword.bind(this));
        this.router.put(`${this.path}/changePassword`, this.changePassword.bind(this));
        super.initializeRoutes();
    }
    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        // let studentDetails: any;
        let result;
        req.body['role'] = 'STUDENT'
        result = await this.authService.login(req.body);

        if (!result) {
            return res.status(404).send(dispatcher(res, result, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(401).send(dispatcher(res, result.error, 'error', speeches.USER_RISTRICTED, 401));
        } else {
            //studentDetails = await this.authService.getServiceDetails('student', { user_id: result.data.user_id });
            const studentData = await this.authService.crudService.findOne(student, {
                where: { user_id: result.data.user_id }
            });
            result.data['type_id'] = studentData.dataValues.type;
            result.data['student_id'] = studentData.dataValues.student_id;
            result.data['district'] = studentData.dataValues.district;
            return res.status(200).send(dispatcher(res, result.data, 'success', speeches.USER_LOGIN_SUCCESS));
        }
    }
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
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
            let data: any = {}
            let where: any = { 'status': 'ACTIVE' }
            let { district, team, student_id } = newREQQuery
            if (req.params.id) {
                const newParamId = await this.authService.decryptGlobal(req.params.id);
                where[`student_id`] = newParamId;
                data = await this.crudService.findOne(student, {
                    attributes: {
                        include: [
                            [
                                db.literal(`( SELECT username FROM users AS u WHERE u.user_id = \`student\`.\`user_id\`)`), 'username_email'
                            ]
                        ]
                    },
                    where: {
                        [Op.and]: [
                            where,
                        ],
                    }
                });
            } else if (team) {
                data = await db.query(`SELECT 
    student_id,
    s.user_id,
    s.full_name,
    mobile,
    district,
    college_type,
    college_name,
    roll_number,
    id_number,
    branch,
    year_of_study,
    type,
    username
FROM
    students AS s
      INNER JOIN
    users AS u ON s.user_id = u.user_id
WHERE
    s.status = 'ACTIVE' and (student_id = ${student_id} || type = ${student_id});`, { type: QueryTypes.SELECT })
            }
            else {
                try {
                    if (district !== 'All Districts' && typeof district == 'string') {
                        where[`district`] = district;
                    }
                    const responseOfFindAndCountAll = await this.crudService.findAndCountAll(student, {
                        attributes: {
                            include: [
                                [
                                    db.literal(`( SELECT username FROM users AS u WHERE u.user_id = \`student\`.\`user_id\`)`), 'username_email'
                                ]
                            ]
                        },
                        where: {
                            [Op.and]: [
                                where
                            ]
                        }
                    });
                    data = responseOfFindAndCountAll;
                } catch (error: any) {
                    return res.status(500).send(dispatcher(res, data, 'error'))
                }
            }
            return res.status(200).send(dispatcher(res, data, 'success'));
        } catch (error) {
            next(error);
        }
    }
    protected async updateData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) {
                this.model = model;
            };
            const newParamId: any = await this.authService.decryptGlobal(req.params.id);
            const studentTableDetails = await student.findOne(
                {
                    where: {
                        student_id: JSON.parse(newParamId)
                    }
                }
            )
            if (!studentTableDetails) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentTableDetails instanceof Error) {
                throw studentTableDetails
            }

            const where: any = {};
            where[`${this.model}_id`] = JSON.parse(newParamId);
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded);
            if (req.body.username) {
                const username = req.body.username;
                const studentDetails = await this.crudService.findOne(user, { where: { username: username } });
                if (studentDetails) {
                    if (studentDetails.dataValues.username == username) throw badRequest(speeches.USER_EMAIL_EXISTED);
                    if (studentDetails instanceof Error) throw studentDetails;
                };
                const user_data = await this.crudService.update(user, {
                    username: username
                }, { where: { user_id: studentTableDetails.getDataValue("user_id") } });
                if (!user_data) {
                    throw internal()
                }
                if (user_data instanceof Error) {
                    throw user_data;
                }
            }
            if (req.body.mobile) {
                const mobile = req.body.mobile;
                const studentDetails = await this.crudService.findOne(student, { where: { mobile: mobile } });
                if (studentDetails) {
                    if (studentDetails.dataValues.mobile == mobile) throw badRequest(speeches.USER_MOBILE_EXISTED);
                    if (studentDetails instanceof Error) throw studentDetails;
                };
                const user_data = await this.crudService.update(student, {
                    mobile: mobile
                }, { where: { user_id: studentTableDetails.getDataValue("user_id") } });
                if (!user_data) {
                    throw internal()
                }
                if (user_data instanceof Error) {
                    throw user_data;
                }
            }
            if (req.body.full_name) {
                const user_data = await this.crudService.update(user, {
                    full_name: payload.full_name
                }, { where: { user_id: studentTableDetails.getDataValue("user_id") } });
                if (!user_data) {
                    throw internal()
                }
                if (user_data instanceof Error) {
                    throw user_data;
                }
            }
            const student_data = await this.crudService.updateAndFind(modelLoaded, payload, { where: where });
            if (!student_data) {
                throw badRequest()
            }
            if (student_data instanceof Error) {
                throw student_data;
            }
            return res.status(200).send(dispatcher(res, student_data, 'updated'));
        } catch (error) {
            next(error);
        }
    }
    protected async deleteData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) this.model = model;
            const where: any = {};
            const newParamId = await this.authService.decryptGlobal(req.params.id);
            where[`${this.model}_id`] = newParamId;
            const getUserIdFromStudentData = await this.crudService.findOne(student, { where: { student_id: where.student_id } });
            if (!getUserIdFromStudentData) throw notFound(speeches.USER_NOT_FOUND);
            if (getUserIdFromStudentData instanceof Error) throw getUserIdFromStudentData;
            const user_id = getUserIdFromStudentData.dataValues.user_id;
            const deleteUserStudentAndRemoveAllResponses = await this.authService.deleteStudentAndStudentResponse(user_id);
            const data = deleteUserStudentAndRemoveAllResponses
            return res.status(200).send(dispatcher(res, data, 'deleted'));
        } catch (error) {
            next(error);
        }
    }
    protected async deleteAllData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model, id } = req.params;
            if (model) this.model = model;
            const where: any = {};
            const newParamId = await this.authService.decryptGlobal(req.params.student_id);
            where[`${this.model}_id`] = newParamId;
            const getUserIdFromStudentData = await this.crudService.findOne(student, { where: { student_id: where.student_id } });
            if (!getUserIdFromStudentData) throw notFound(speeches.USER_NOT_FOUND);
            if (getUserIdFromStudentData instanceof Error) throw getUserIdFromStudentData;
            const user_id = getUserIdFromStudentData.dataValues.user_id;
            const getteamuserIdfromstudentdata = await this.crudService.findAll(student, { where: { type: where.student_id } });

            if (getteamuserIdfromstudentdata && !(getteamuserIdfromstudentdata instanceof Error)) {
                const arrayOfStudentuserIds = getteamuserIdfromstudentdata.map((student: any) => student.user_id)
                for (var i = 0; i < arrayOfStudentuserIds.length; i++) {
                    const deletStudentResponseData = await this.authService.deleteStudentAndStudentResponse(arrayOfStudentuserIds[i])
                    if (deletStudentResponseData instanceof Error) {
                        throw deletStudentResponseData;
                    }
                };
            }

            const deleteUserStudentAndRemoveAllResponses = await this.authService.deleteStudentAndStudentResponse(user_id);
            const data = deleteUserStudentAndRemoveAllResponses
            return res.status(200).send(dispatcher(res, data, 'deleted'));
        } catch (error) {
            next(error);
        }
    }
    private async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            req.body.password = req.body.confirmPassword;
            req.body.role = 'STUDENT';
            req.body.type = 0;
            const payload = this.autoFillTrackingColumns(req, res, student);
            const result = await this.authService.studentRegister(payload);
            if (result && result.output && result.output.payload && result.output.payload.message == 'Email') {
                return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS, 406));
            }
            if (result && result.output && result.output.payload && result.output.payload.message == 'Mobile') {
                return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS_MOBILE, 406));
            }
            const data = result.dataValues;
            return res.status(201).send(dispatcher(res, data, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
        } catch (err) {
            next(err)
        }
    }
    private async addStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            req.body.password = req.body.confirmPassword;
            req.body.role = 'STUDENT';
            const payload = this.autoFillTrackingColumns(req, res, student);
            const result = await this.authService.studentRegister(payload);
            if (result && result.output && result.output.payload && result.output.payload.message == 'Email') {
                return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS, 406));
            }
            if (result && result.output && result.output.payload && result.output.payload.message == 'Mobile') {
                return res.status(406).send(dispatcher(res, result.data, 'error', speeches.MENTOR_EXISTS_MOBILE, 406));
            }
            const data = result.dataValues;
            return res.status(201).send(dispatcher(res, data, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
        } catch (err) {
            next(err)
        }
    }
    // private async bulkCreateStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    //     try {
    //         for (let student in req.body) {
    //             if (!req.body[student].team_id) throw notFound(speeches.USER_TEAMID_REQUIRED);
    //             //const team_id = req.body[student].team_id
    //             // if (team_id) {
    //             //     const teamCanAddMember = await this.authService.checkIfTeamHasPlaceForNewMember(team_id)
    //             //     if (!teamCanAddMember) {
    //             //         throw badRequest(speeches.TEAM_MAX_MEMBES_EXCEEDED)
    //             //     }
    //             //     if (teamCanAddMember instanceof Error) {
    //             //         throw teamCanAddMember;
    //             //     }
    //             // }
    //         }
    //         let cryptoEncryptedString: any;
    //         const teamName = await this.authService.crudService.findOne(team, {
    //             attributes: ["team_name"], where: { team_id: req.body[0].team_id }
    //         });
    //         if (!teamName) throw notFound(speeches.TEAM_NOT_FOUND, 406);
    //         if (teamName instanceof Error) throw teamName;
    //         for (let student in req.body) {
    //             cryptoEncryptedString = await this.authService.generateCryptEncryption('STUDENT@123');
    //             req.body[student].username = `${req.body[student].team_id}_${req.body[student].full_name.trim()}`;
    //             req.body[student].full_name = req.body[student].full_name.trim();
    //             req.body[student].role = 'STUDENT';
    //             req.body[student].password = cryptoEncryptedString;
    //             req.body[student].created_by = res.locals.user_id
    //             req.body[student].updated_by = res.locals.user_id
    //         }
    //         const responseFromService = await this.authService.bulkCreateStudentService(req.body);
    //         return res.status(201).send(dispatcher(res, responseFromService, 'success', speeches.USER_REGISTERED_SUCCESSFULLY, 201));
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    private async addBadgeToStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            //todo: test this api : haven't manually tested this api yet 
            const student_user_id: any = await this.authService.decryptGlobal(req.params.student_user_id);
            const badges_ids: any = req.body.badge_ids;
            const badges_slugs: any = req.body.badge_slugs;
            let areSlugsBeingUsed = true;
            if (!badges_slugs || !badges_slugs.length || badges_slugs.length <= 0) {
                areSlugsBeingUsed = false;
            }

            if (!areSlugsBeingUsed && (!badges_ids || !badges_ids.length || badges_ids.length <= 0)) {
                throw badRequest(speeches.BADGE_IDS_ARRAY_REQUIRED)
            }

            const serviceStudent = new StudentService()
            let studentBadgesObj: any = await serviceStudent.getStudentBadges(student_user_id);
            ///do not do empty or null check since badges obj can be null if no badges earned yet hence this is not an error condition 
            if (studentBadgesObj instanceof Error) {
                throw studentBadgesObj
            }
            if (!studentBadgesObj) {
                studentBadgesObj = {};
            }
            const success: any = []
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

                const date = new Date();
                const studentHasBadgeObjForId = studentBadgesObj[badgeResultForId.dataValues.slug]
                if (!studentHasBadgeObjForId || !studentHasBadgeObjForId.completed_date) {
                    studentBadgesObj[badgeResultForId.dataValues.slug] = {
                        completed_date: (new Date())
                        // completed_date: ("" + date.getFullYear() + "-" + "" + (date.getMonth() + 1) + "-" + "" + date.getDay())
                    }
                }
            }
            const studentBadgesObjJson = JSON.stringify(studentBadgesObj)
            const result: any = await student.update({ badges: studentBadgesObjJson }, {
                where: {
                    user_id: student_user_id
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

            return res.status(resStatus).send(dispatcher(res, { errs: errors, success: studentBadgesObj }, dispatchStatus, dispatchStatusMsg, resStatus));
        } catch (err) {
            next(err)
        }
    }
    private async getStudentBadges(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        //todo: implement this api ...!!
        try {
            const student_user_id: any = await this.authService.decryptGlobal(req.params.student_user_id);
            const serviceStudent = new StudentService()
            let studentBadgesObj: any = await serviceStudent.getStudentBadges(student_user_id);
            ///do not do empty or null check since badges obj can be null if no badges earned yet hence this is not an error condition 
            if (studentBadgesObj instanceof Error) {
                throw studentBadgesObj
            }
            if (!studentBadgesObj) {
                studentBadgesObj = {};
            }
            const studentBadgesObjKeysArr = Object.keys(studentBadgesObj)
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
            where['role'] = 'student';
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
            // console.log(studentBadgesObj);
            for (var i = 0; i < allBadgesResult.length; i++) {
                const currBadge: any = allBadgesResult[i];
                if (studentBadgesObj.hasOwnProperty("" + currBadge.slug)) {
                    currBadge["student_status"] = studentBadgesObj[("" + currBadge.slug)].completed_date
                } else {
                    currBadge["student_status"] = null;
                }
                allBadgesResult[i] = currBadge
            }

            return res.status(200).send(dispatcher(res, allBadgesResult, 'success'));
        } catch (err) {
            next(err)
        }
    }
    private async studentCertificate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let newREParams: any = {};
            if (req.params) {
                const newParams: any = await this.authService.decryptGlobal(req.params);
                newREParams = JSON.parse(newParams);
            } else {
                newREParams = req.params
            }
            const { model, student_user_id } = newREParams;
            const user_id = res.locals.user_id
            if (model) {
                this.model = model;
            };
            const where: any = {};
            where[`${this.model}_id`] = newREParams.id;
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded);
            payload["certificate"] = new Date().toLocaleString();
            const updateCertificate = await this.crudService.updateAndFind(student, payload, {
                where: { student_id: student_user_id }
            });
            if (!updateCertificate) {
                throw internal()
            }
            if (updateCertificate instanceof Error) {
                throw updateCertificate;
            }
            return res.status(200).send(dispatcher(res, updateCertificate, 'Certificate Updated'));
        } catch (error) {
            next(error);
        }
    }
    private async emailOtp(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { username } = req.body;
            if (!username) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            const result = await this.authService.emailotp(req.body, student);
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
    private async getPilotStudent(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const { college_name } = newREQQuery
            let result: any = {};
            result = await db.query(`SELECT 
    Smain.student_id,
    Smain.full_name,
    IFNULL(CONCAT('[', 
           GROUP_CONCAT(
               CONCAT('{"full_name": "', sub.full_name, '", "student_id": "', sub.student_id, '"}')
               ORDER BY sub.student_id SEPARATOR ', '), 
           ']'), '[]') AS crewDetails,
           count(sub.student_id) as crewCount
FROM
    students AS Smain
LEFT JOIN 
    students AS sub ON sub.type = Smain.student_id
WHERE
    Smain.type = 0 && Smain.college_name = '${college_name}'
GROUP BY 
    Smain.student_id, Smain.full_name;
`, { type: QueryTypes.SELECT });
            res.status(200).send(dispatcher(res, result, 'done'))
        } catch (error) {
            next(error)
        }
    }
    private async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { email, role } = req.body;
            if (!email) {
                throw badRequest(speeches.USER_EMAIL_REQUIRED);
            }
            if (!role) {
                throw badRequest(speeches.USER_ROLE_REQUIRED);
            }
            const result = await this.authService.studentResetPassword(req.body);
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
    private async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
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

}
