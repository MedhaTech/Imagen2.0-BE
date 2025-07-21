import { Request, Response, NextFunction } from 'express';
import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import { studentLoginSchema, studentSchema, studentSchemaAddstudent, studentUpdateSchema } from '../validations/student.validationa';
import authService from '../services/auth.service';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import validationMiddleware from '../middlewares/validation.middleware';
import { Op, QueryTypes } from 'sequelize';
import { user } from '../models/user.model';
import { student } from '../models/student.model';
import { badRequest, internal, notFound } from 'boom';
import db from "../utils/dbconnection.util"
import { challenge_response } from '../models/challenge_response.model';

export default class StudentController extends BaseController {
    model = "student";
    authService: authService = new authService;

    protected initializePath(): void {
        this.path = '/students';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(studentSchema, studentUpdateSchema);
    }
    protected initializeRoutes(): void {
        this.router.post(`${this.path}/register`, validationMiddleware(studentSchema), this.register.bind(this));
        this.router.post(`${this.path}/addStudent`, validationMiddleware(studentSchemaAddstudent), this.addStudent.bind(this));
        this.router.get(`${this.path}/:student_user_id/studentCertificate`, this.studentCertificate.bind(this));
        this.router.post(`${this.path}/emailOtp`, this.emailOtp.bind(this));
        this.router.post(`${this.path}/login`, validationMiddleware(studentLoginSchema), this.login.bind(this));
        this.router.get(`${this.path}/ListOfPilotStudent`, this.getPilotStudent.bind(this));
        this.router.delete(`${this.path}/:student_id/deleteAllData`, this.deleteAllData.bind(this));
        this.router.put(`${this.path}/forgotPassword`, this.forgotPassword.bind(this));
        this.router.put(`${this.path}/changePassword`, this.changePassword.bind(this));
        this.router.post(`${this.path}/triggerWelcomeEmail`, this.triggerWelcomeEmail.bind(this));
        this.router.get(`${this.path}/IsCertificate`, this.getCertificate.bind(this));
        this.router.get(`${this.path}/milestones`, this.getmilestones.bind(this));
        this.router.get(`${this.path}/CIDteamMenbers`, this.getCIDteamMenbers.bind(this));
        super.initializeRoutes();
    }
    //login api for the student users 
    //Input username and password
    private async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {

        let result;
        req.body['role'] = 'STUDENT'
        result = await this.authService.login(req.body);

        if (!result) {
            return res.status(404).send(dispatcher(res, result, 'error', speeches.USER_NOT_FOUND));
        } else if (result.error) {
            return res.status(401).send(dispatcher(res, result.error, 'error', speeches.USER_RISTRICTED, 401));
        } else {

            const studentData = await this.authService.crudService.findOne(student, {
                where: { user_id: result.data.user_id }
            });
            result.data['type_id'] = studentData.dataValues.type;
            result.data['student_id'] = studentData.dataValues.student_id;
            result.data['district'] = studentData.dataValues.district;
            return res.status(200).send(dispatcher(res, result.data, 'success', speeches.USER_LOGIN_SUCCESS));
        }
    }
    //Fetching student all details 
    //Single student details by student id
    //All student list
    protected async getData(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'MENTORSHIP') {
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
    username,
    gender,
    college_town
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
    //Updating the student data by student id
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
    //Deleting student data
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
    //Deleting student data and team members also
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

            const IdeaData = await this.crudService.findOne(challenge_response, { where: { student_id: where.student_id } });
            if (IdeaData) {
                await this.crudService.delete(challenge_response, { where: { student_id: where.student_id } })
            }

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
    //Creating pilot student users
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
    //Creating crew student users
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
    //Enabling student certificate on business condition
    private async studentCertificate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const { model } = req.params;
            if (model) {
                this.model = model;
            };
            const newParamId = await this.authService.decryptGlobal(req.params.student_user_id);
            const modelLoaded = await this.loadModel(model);
            const payload = this.autoFillTrackingColumns(req, res, modelLoaded);
            payload["certificate"] = new Date().toLocaleString();
            const updateCertificate = await this.crudService.updateAndFind(student, payload, {
                where: { user_id: newParamId }
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
    //sending otp to user at the time of registration
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
    //fetching all student in team wise like pilot and crew members
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
    (select status from challenge_responses as c where c.student_id = Smain.student_id) as ideaStatus,
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
    //Sending temp password to student email
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
    //change password for student
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
    //after successfully student registation welcome is send to user
    protected async triggerWelcomeEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            if (!req.body.student_id) {
                throw badRequest(speeches.USER_STUDENTID_REQUIRED);
            }
            const crewDetails = await db.query(`SELECT 
    s.full_name, mobile, username
FROM
    students AS s
        JOIN
    users AS u ON s.user_id = u.user_id
WHERE
    student_id = ${req.body.student_id} OR type = ${req.body.student_id}`, { type: QueryTypes.SELECT });

            const result = await this.authService.triggerWelcome(req.body, 'Student User', crewDetails);
            return res.status(200).send(dispatcher(res, result, 'success'));
        } catch (error) {
            next(error);
        }
    }
    //Fetching stduent certificate
    protected async getCertificate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
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
            const { student_id } = newREQQuery

            result = await db.query(`SELECT 
    cr.status,CASE
        WHEN COUNT(e.overall) > 1 THEN (SUM(e.overall) / COUNT(e.overall))
        ELSE (SUM(e.overall) / 2.0)
    END AS score
FROM
    challenge_responses AS cr
        JOIN
    evaluator_ratings AS e ON cr.challenge_response_id = e.challenge_response_id
WHERE
    cr.student_id = ${student_id}`, { type: QueryTypes.SELECT });

            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //Fetching stduent milestones
    protected async getmilestones(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
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
            const { challenge_response_id } = newREQQuery

            result = await db.query(`SELECT 
    m.milestone_id,
    name,
    description,
    milestone_progress_id,
    mp.status,
    challenge_response_id,
    mp.note,
    mp.file
FROM
    milestones AS m
LEFT JOIN
    milestone_progress AS mp 
    ON m.milestone_id = mp.milestone_id 
    AND mp.challenge_response_id = ${challenge_response_id};
`, { type: QueryTypes.SELECT });

            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //Fetching team Members by cid 
    protected async getCIDteamMenbers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM') {
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
            const { challenge_response_id } = newREQQuery

            result = await db.query(`SELECT 
    s.full_name
FROM
    students s
        JOIN
    challenge_responses cr ON s.student_id = cr.student_id
        OR s.type = cr.student_id
WHERE
    cr.challenge_response_id = ${challenge_response_id};
`, { type: QueryTypes.SELECT });

            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }

}
