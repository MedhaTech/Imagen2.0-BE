import { Request, Response, NextFunction } from "express";
import { mentor } from "../models/mentor.model";
import { organization } from "../models/organization.model";
import dispatcher from "../utils/dispatch.util";
import db from "../utils/dbconnection.util"
import { quiz_survey_response } from '../models/quiz_survey_response.model';
import BaseController from "./base.controller";
import { constents } from "../configs/constents.config";
import { mentor_course_topic } from "../models/mentor_course_topic.model";
import { internal, notFound } from "boom";
import { speeches } from "../configs/speeches.config";
import { Op, QueryTypes } from 'sequelize';
import { user } from "../models/user.model";
import { team } from "../models/team.model";
import { baseConfig } from "../configs/base.config";

export default class ReportController extends BaseController {
    model = "mentor"; ///giving any name because this shouldnt be used in any apis in this controller
    protected initializePath(): void {
        this.path = '/reports';
    }
    protected initializeValidations(): void {
    }
    protected initializeRoutes(): void {
        this.router.get(this.path + "/mentorsummary", this.mentorsummary.bind(this));
        this.router.get(this.path + "/mentorRegList", this.getMentorRegList.bind(this));
        this.router.get(this.path + "/notRegistered", this.notRegistered.bind(this));
        this.router.get(`${this.path}/mentordetailstable`, this.getmentorDetailstable.bind(this));
        this.router.get(`${this.path}/mentordetailsreport`, this.getmentorDetailsreport.bind(this));
        this.router.get(`${this.path}/studentdetailstable`, this.getstudentDetailstable.bind(this));
        this.router.get(`${this.path}/studentdetailsreport`, this.getstudentDetailsreport.bind(this));
    }
    protected async mentorsummary(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const state = newREQQuery.state;
            let summary
            if (state) {
                summary = await db.query(`SELECT 
                org.state,
                org.ATL_Count,
                org.ATL_Reg_Count,
                (org.ATL_Count - org.ATL_Reg_Count) AS total_not_Reg_ATL,
                org.NONATL_Reg_Count,
                org.male_mentor_count,
                org.female_mentor_count,
                org.male_mentor_count + org.female_mentor_count AS total_registered_teachers
            FROM
                (SELECT 
                    o.state,
                        COUNT(CASE
                            WHEN o.category = 'ATL' THEN 1
                        END) AS ATL_Count,
                        COUNT(CASE
                            WHEN
                                m.mentor_id <> 'null'
                                    AND o.category = 'ATL'
                            THEN
                                1
                        END) AS ATL_Reg_Count,
                        COUNT(CASE
                            WHEN
                                m.mentor_id <> 'null'
                                    AND o.category = 'Non ATL'
                            THEN
                                1
                        END) AS NONATL_Reg_Count,
                        SUM(CASE
                            WHEN m.gender = 'Male' THEN 1
                            ELSE 0
                        END) AS male_mentor_count,
                        SUM(CASE
                            WHEN m.gender = 'Female' THEN 1
                            ELSE 0
                        END) AS female_mentor_count
                FROM
                    organizations o
                LEFT JOIN mentors m ON o.organization_code = m.organization_code
                WHERE
                    o.status = 'ACTIVE' && o.state= '${state}'
                GROUP BY o.state) AS org`, { type: QueryTypes.SELECT });

            } else {
                summary = await db.query(`SELECT 
            org.state,
            org.ATL_Count,
            org.ATL_Reg_Count,
            (org.ATL_Count - org.ATL_Reg_Count) AS total_not_Reg_ATL,
            org.NONATL_Reg_Count,
            org.male_mentor_count,
            org.female_mentor_count,
            org.male_mentor_count + org.female_mentor_count AS total_registered_teachers
        FROM
            (SELECT 
                o.state,
                    COUNT(CASE
                        WHEN o.category = 'ATL' THEN 1
                    END) AS ATL_Count,
                    COUNT(CASE
                        WHEN
                            m.mentor_id <> 'null'
                                AND o.category = 'ATL'
                        THEN
                            1
                    END) AS ATL_Reg_Count,
                    COUNT(CASE
                        WHEN
                            m.mentor_id <> 'null'
                                AND o.category = 'Non ATL'
                        THEN
                            1
                    END) AS NONATL_Reg_Count,
                    SUM(CASE
                        WHEN m.gender = 'Male' THEN 1
                        ELSE 0
                    END) AS male_mentor_count,
                    SUM(CASE
                        WHEN m.gender = 'Female' THEN 1
                        ELSE 0
                    END) AS female_mentor_count
            FROM
                organizations o
            LEFT JOIN mentors m ON o.organization_code = m.organization_code
            WHERE
                o.status = 'ACTIVE'
            GROUP BY o.state) AS org 
        UNION ALL SELECT 
            'Total',
            SUM(ATL_Count),
            SUM(ATL_Reg_Count),
            SUM(ATL_Count - ATL_Reg_Count),
            SUM(NONATL_Reg_Count),
            SUM(male_mentor_count),
            SUM(female_mentor_count),
            SUM(male_mentor_count + female_mentor_count)
        FROM
            (SELECT 
                o.state,
                    COUNT(CASE
                        WHEN o.category = 'ATL' THEN 1
                    END) AS ATL_Count,
                    COUNT(CASE
                        WHEN
                            m.mentor_id <> 'null'
                                AND o.category = 'ATL'
                        THEN
                            1
                    END) AS ATL_Reg_Count,
                    COUNT(CASE
                        WHEN
                            m.mentor_id <> 'null'
                                AND o.category = 'Non ATL'
                        THEN
                            1
                    END) AS NONATL_Reg_Count,
                    SUM(CASE
                        WHEN m.gender = 'Male' THEN 1
                        ELSE 0
                    END) AS male_mentor_count,
                    SUM(CASE
                        WHEN m.gender = 'Female' THEN 1
                        ELSE 0
                    END) AS female_mentor_count
            FROM
                organizations o
            LEFT JOIN mentors m ON o.organization_code = m.organization_code
            WHERE
                o.status = 'ACTIVE'
            GROUP BY o.state) AS org;`, { type: QueryTypes.SELECT });
            }
            data = summary;
            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getMentorRegList(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
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
            const { page, size, status, district, category, state } = newREQQuery;
            const { limit, offset } = this.getPagination(page, size);
            const paramStatus: any = newREQQuery.status;
            let whereClauseStatusPart: any = {};
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                if (paramStatus === 'ALL') {
                    whereClauseStatusPart = {};
                    addWhereClauseStatusPart = false;
                } else {
                    whereClauseStatusPart = { "status": paramStatus };
                    addWhereClauseStatusPart = true;
                }
            } else {
                whereClauseStatusPart = { "status": "ACTIVE" };
                addWhereClauseStatusPart = true;
            }
            let districtFilter: any = {}
            if (district !== 'All Districts' && category !== 'All Categories' && state !== 'All States') {
                districtFilter = { category, district, status, state }
            } else if (district !== 'All Districts') {
                districtFilter = { district, status }
            } else if (category !== 'All Categories') {
                districtFilter = { category, status }
            } else if (state !== 'All States') {
                districtFilter = { status, state }
            }
            else {
                districtFilter = { status }
            }
            const mentorsResult = await mentor.findAll({
                attributes: [
                    "full_name",
                    "gender",
                    "mobile",
                    "whatapp_mobile",
                ],
                raw: true,
                where: {
                    [Op.and]: [
                        whereClauseStatusPart
                    ]
                },
                include: [
                    {
                        where: districtFilter,
                        model: organization,
                        attributes: [
                            "organization_code",
                            "unique_code",
                            "organization_name",
                            "category",
                            "state",
                            "district",
                            "city",
                            "pin_code",
                            "address",
                            "principal_name",
                            "principal_mobile"
                        ]
                    },
                    {
                        model: user,
                        attributes: [
                            "username",
                            "user_id"
                        ]
                    }
                ],
                limit, offset
            });
            if (!mentorsResult) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (mentorsResult instanceof Error) {
                throw mentorsResult
            }
            res.status(200).send(dispatcher(res, mentorsResult, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async notRegistered(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
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
            const { district, category, state } = newREQQuery;

            let districtFilter: any = ''
            let categoryFilter: any = ''
            let stateFilter: any = ''
            if (district !== 'All Districts' && category !== 'All Categories' && state !== 'All States') {
                districtFilter = `'${district}'`
                categoryFilter = `'${category}'`
                stateFilter = `'${state}'`
            } else if (district !== 'All Districts') {
                districtFilter = `'${district}'`
                categoryFilter = `'%%'`
                stateFilter = `'%%'`
            } else if (category !== 'All Categories') {
                categoryFilter = `'${category}'`
                districtFilter = `'%%'`
                stateFilter = `'%%'`
            } else if (state !== 'All States') {
                stateFilter = `'${state}'`
                districtFilter = `'%%'`
                categoryFilter = `'%%'`
            }
            else {
                districtFilter = `'%%'`
                categoryFilter = `'%%'`
                stateFilter = `'%%'`
            }
            const mentorsResult = await db.query(`SELECT 
            organization_id,
            organization_code,
            unique_code,
            organization_name,
            district,
            state,
            category,
            city,
            state,
            country,
            pin_code,
            address,
            principal_name,
            principal_mobile,
            principal_email FROM organizations WHERE status='ACTIVE' && district LIKE ${districtFilter} && category LIKE ${categoryFilter} && state LIKE ${stateFilter} && NOT EXISTS(SELECT mentors.organization_code  from mentors WHERE organizations.organization_code = mentors.organization_code) `, { type: QueryTypes.SELECT });
            if (!mentorsResult) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (mentorsResult instanceof Error) {
                throw mentorsResult
            }
            res.status(200).send(dispatcher(res, mentorsResult, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getmentorDetailstable(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const state = newREQQuery.state;
            let wherefilter = '';
            if (state) {
                wherefilter = `&& og.state= '${state}'`;
            }
            const summary = await db.query(`SELECT 
            og.state, COUNT(mn.mentor_id) AS totalReg
        FROM
            organizations AS og
                LEFT JOIN
            mentors AS mn ON og.organization_code = mn.organization_code
            WHERE og.status='ACTIVE' ${wherefilter}
        GROUP BY og.state;`, { type: QueryTypes.SELECT });
            const teamCount = await db.query(`SELECT 
        og.state, COUNT(t.team_id) AS totalTeams
    FROM
        organizations AS og
            LEFT JOIN
        mentors AS mn ON og.organization_code = mn.organization_code
            INNER JOIN
        teams AS t ON mn.mentor_id = t.mentor_id
        WHERE og.status='ACTIVE' ${wherefilter}
    GROUP BY og.state;`, { type: QueryTypes.SELECT });
            const studentCountDetails = await db.query(`SELECT 
        og.state,
        COUNT(st.student_id) AS totalstudent,
        SUM(CASE
            WHEN st.gender = 'MALE' THEN 1
            ELSE 0
        END) AS male,
        SUM(CASE
            WHEN st.gender = 'FEMALE' THEN 1
            ELSE 0
        END) AS female
    FROM
        organizations AS og
            LEFT JOIN
        mentors AS mn ON og.organization_code = mn.organization_code
            INNER JOIN
        teams AS t ON mn.mentor_id = t.mentor_id
            INNER JOIN
        students AS st ON st.team_id = t.team_id
        WHERE og.status='ACTIVE' ${wherefilter}
    GROUP BY og.state;`, { type: QueryTypes.SELECT });
            const courseINcompleted = await db.query(`select state,count(*) as courseIN from (SELECT 
            state,cou
        FROM
            organizations AS og
                LEFT JOIN
            (SELECT 
                organization_code, cou
            FROM
                mentors AS mn
            LEFT JOIN (SELECT 
                user_id, COUNT(*) AS cou
            FROM
                mentor_topic_progress
            GROUP BY user_id having count(*)<${baseConfig.MENTOR_COURSE}) AS t ON mn.user_id = t.user_id ) AS c ON c.organization_code = og.organization_code WHERE og.status='ACTIVE' ${wherefilter}
        group by organization_id having cou<${baseConfig.MENTOR_COURSE}) as final group by state;`, { type: QueryTypes.SELECT });
            const courseCompleted = await db.query(`select state,count(*) as courseCMP from (SELECT 
            state,cou
        FROM
            organizations AS og
                LEFT JOIN
            (SELECT 
                organization_code, cou
            FROM
                mentors AS mn
            LEFT JOIN (SELECT 
                user_id, COUNT(*) AS cou
            FROM
                mentor_topic_progress
            GROUP BY user_id having count(*)>=${baseConfig.MENTOR_COURSE}) AS t ON mn.user_id = t.user_id ) AS c ON c.organization_code = og.organization_code WHERE og.status='ACTIVE' ${wherefilter}
        group by organization_id having cou>=${baseConfig.MENTOR_COURSE}) as final group by state`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
            data['teamCount'] = teamCount;
            data['studentCountDetails'] = studentCountDetails;
            data['courseCompleted'] = courseCompleted;
            data['courseINcompleted'] = courseINcompleted;
            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        } catch (err) {
            console.log(err)
            next(err)
        }
    }
    protected async getstudentDetailstable(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const state = newREQQuery.state;
            let wherefilter = '';
            if (state) {
                wherefilter = `&& og.state= '${state}'`;
            }
            const summary = await db.query(`SELECT 
            og.state, COUNT(t.team_id) AS totalTeams
        FROM
            organizations AS og
                LEFT JOIN
            mentors AS mn ON og.organization_code = mn.organization_code
                LEFT JOIN
            teams AS t ON mn.mentor_id = t.mentor_id
            WHERE og.status='ACTIVE' ${wherefilter}
        GROUP BY og.state;`, { type: QueryTypes.SELECT });
            const studentCountDetails = await db.query(`SELECT 
            og.state,
            COUNT(st.student_id) AS totalstudent
        FROM
            organizations AS og
                LEFT JOIN
            mentors AS mn ON og.organization_code = mn.organization_code
                INNER JOIN
            teams AS t ON mn.mentor_id = t.mentor_id
                INNER JOIN
            students AS st ON st.team_id = t.team_id where og.status = 'ACTIVE' ${wherefilter}
        GROUP BY og.state;`, { type: QueryTypes.SELECT });
            const courseCompleted = await db.query(`SELECT 
            og.state,count(st.student_id) as studentCourseCMP
        FROM
            students AS st
                JOIN
            teams AS te ON st.team_id = te.team_id
                JOIN
            mentors AS mn ON te.mentor_id = mn.mentor_id
                JOIN
            organizations AS og ON mn.organization_code = og.organization_code
                JOIN
            (SELECT 
                user_id, COUNT(*)
            FROM
                user_topic_progress
            GROUP BY user_id
            HAVING COUNT(*) >= ${baseConfig.STUDENT_COURSE}) AS temp ON st.user_id = temp.user_id WHERE og.status='ACTIVE' ${wherefilter} group by og.state`, { type: QueryTypes.SELECT });
            const courseINprogesss = await db.query(`SELECT 
            og.state,count(st.student_id) as studentCourseIN
        FROM
            students AS st
                JOIN
            teams AS te ON st.team_id = te.team_id
                JOIN
            mentors AS mn ON te.mentor_id = mn.mentor_id
                JOIN
            organizations AS og ON mn.organization_code = og.organization_code
                JOIN
            (SELECT 
                user_id, COUNT(*)
            FROM
                user_topic_progress
            GROUP BY user_id
            HAVING COUNT(*) < ${baseConfig.STUDENT_COURSE}) AS temp ON st.user_id = temp.user_id WHERE og.status='ACTIVE' ${wherefilter} group by og.state`, { type: QueryTypes.SELECT });
            const submittedCount = await db.query(`SELECT 
            og.state,count(te.team_id) as submittedCount
        FROM
            teams AS te
                JOIN
            mentors AS mn ON te.mentor_id = mn.mentor_id
                JOIN
            organizations AS og ON mn.organization_code = og.organization_code
                JOIN
            (SELECT 
                team_id, status
            FROM
                challenge_responses
            WHERE
                status = 'SUBMITTED') AS temp ON te.team_id = temp.team_id WHERE og.status='ACTIVE' ${wherefilter} group by og.state`, { type: QueryTypes.SELECT });
            const draftCount = await db.query(`SELECT 
            og.state,count(te.team_id) as draftCount
        FROM
            teams AS te
                JOIN
            mentors AS mn ON te.mentor_id = mn.mentor_id
                JOIN
            organizations AS og ON mn.organization_code = og.organization_code
                JOIN
            (SELECT 
                team_id, status
            FROM
                challenge_responses
            WHERE
                status = 'DRAFT') AS temp ON te.team_id = temp.team_id WHERE og.status='ACTIVE' ${wherefilter} group by og.state`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
            data['studentCountDetails'] = studentCountDetails;
            data['courseCompleted'] = courseCompleted;
            data['courseINprogesss'] = courseINprogesss;
            data['submittedCount'] = submittedCount;
            data['draftCount'] = draftCount;
            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getmentorDetailsreport(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const state = newREQQuery.state;
            let wherefilter = '';
            if (state) {
                wherefilter = `&& og.state= '${state}'`;
            }
            const summary = await db.query(`SELECT 
    mn.mentor_id,
    mn.user_id,
    og.organization_code,
    og.organization_name,
    og.district,
    og.category,
    og.city,
    og.principal_name,
    og.principal_mobile,
    mn.full_name,
    mn.gender,
    mn.mobile,
    mn.whatapp_mobile,
    og.state,
    og.unique_code
FROM
    (mentors AS mn)
        LEFT JOIN
    organizations AS og ON mn.organization_code = og.organization_code
WHERE
    og.status = 'ACTIVE';`, { type: QueryTypes.SELECT });
            const preSurvey = await db.query(`SELECT 
        CASE
            WHEN status = 'ACTIVE' THEN 'Completed'
        END AS 'pre_survey_status',
        user_id
    FROM
        quiz_survey_responses
    WHERE
        quiz_survey_id = 1`, { type: QueryTypes.SELECT });
            const postSurvey = await db.query(`SELECT 
    CASE
        WHEN status = 'ACTIVE' THEN 'Completed'
    END AS 'post_survey_status',
    user_id
FROM
    quiz_survey_responses
WHERE
    quiz_survey_id = 3`, { type: QueryTypes.SELECT });
            const Course = await db.query(`SELECT 
    CASE
        WHEN COUNT(mentor_course_topic_id) >= ${baseConfig.MENTOR_COURSE} THEN 'Completed'
        ELSE 'In Progress'
    END AS 'course_status',
    user_id
FROM
    mentor_topic_progress
GROUP BY user_id`, { type: QueryTypes.SELECT });
            const teamCount = await db.query(`SELECT 
    COUNT(*) AS team_count, mentor_id
FROM
    teams
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const studentCount = await db.query(`SELECT 
    COUNT(*) AS student_count, mentor_id
FROM
    teams
        JOIN
    students ON teams.team_id = students.team_id
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const StudentCourseCmp = await db.query(`SELECT 
    COUNT(*) AS countop, mentor_id
FROM
    (SELECT 
        mentor_id, student_id, COUNT(*), students.user_id
    FROM
        teams
    LEFT JOIN students ON teams.team_id = students.team_id
    JOIN user_topic_progress ON students.user_id = user_topic_progress.user_id
    GROUP BY student_id
    HAVING COUNT(*) >= ${baseConfig.STUDENT_COURSE}) AS total
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const StudentCourseINpro = await db.query(`SELECT 
    COUNT(*) AS courseinprogess, mentor_id
FROM
    (SELECT 
        mentor_id, student_id, COUNT(*), students.user_id
    FROM
        teams
    LEFT JOIN students ON teams.team_id = students.team_id
    JOIN user_topic_progress ON students.user_id = user_topic_progress.user_id
    GROUP BY student_id
    HAVING COUNT(*) < ${baseConfig.STUDENT_COURSE}) AS total
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const StuIdeaSubCount = await db.query(`SELECT 
    COUNT(*) AS submittedcout, mentor_id
FROM
    teams
        JOIN
    challenge_responses ON teams.team_id = challenge_responses.team_id
WHERE
    challenge_responses.status = 'SUBMITTED'
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const StuIdeaDraftCount = await db.query(`SELECT 
    COUNT(*) AS draftcout, mentor_id
FROM
    teams
        JOIN
    challenge_responses ON teams.team_id = challenge_responses.team_id
WHERE
    challenge_responses.status = 'DRAFT'
GROUP BY mentor_id`, { type: QueryTypes.SELECT });
            const Username = await db.query(`SELECT 
    user_id, username
FROM
    users
WHERE
    role = 'MENTOR'`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
            data['preSurvey'] = preSurvey;
            data['postSurvey'] = postSurvey;
            data['Course'] = Course;
            data['teamCount'] = teamCount;
            data['studentCount'] = studentCount;
            data['StudentCourseCmp'] = StudentCourseCmp;
            data['StudentCourseINpro'] = StudentCourseINpro;
            data['StuIdeaSubCount'] = StuIdeaSubCount;
            data['StuIdeaDraftCount'] = StuIdeaDraftCount;
            data['Username'] = Username;

            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getstudentDetailsreport(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const state = newREQQuery.state;
            let wherefilter = '';
            if (state) {
                wherefilter = `&& og.state= '${state}'`;
            }
            const summary = await db.query(`SELECT 
    student_id,
    full_name,
    Age,
    gender,
    Grade,
    team_id,
    user_id,
    disability
FROM
    students;`, { type: QueryTypes.SELECT });
            const teamData = await db.query(`SELECT 
    team_id, team_name, mentor_id
FROM
    teams`, { type: QueryTypes.SELECT });
            const mentorData = await db.query(`SELECT 
    mn.mentor_id,
    mn.user_id,
    og.organization_code,
    og.organization_name,
    og.district,
    og.category,
    og.city,
    og.principal_name,
    og.principal_mobile,
    mn.full_name,
    mn.gender,
    mn.mobile,
    mn.whatapp_mobile,
    og.state,
    og.unique_code
FROM
    (mentors AS mn)
        LEFT JOIN
    organizations AS og ON mn.organization_code = og.organization_code
WHERE
    og.status = 'ACTIVE';`, { type: QueryTypes.SELECT });
            const mentorUsername = await db.query(`SELECT 
               user_id, username
           FROM
               users
           WHERE
               role = 'MENTOR'`, { type: QueryTypes.SELECT });
            const preSurvey = await db.query(`SELECT 
                CASE
                    WHEN status = 'ACTIVE' THEN 'Completed'
                END AS 'pre_survey_status',
                user_id
            FROM
                quiz_survey_responses
            WHERE
                quiz_survey_id = 2`, { type: QueryTypes.SELECT });
            const postSurvey = await db.query(`SELECT 
    CASE
        WHEN status = 'ACTIVE' THEN 'Completed'
    END AS 'post_survey_status',
    user_id
FROM
    quiz_survey_responses
WHERE
    quiz_survey_id = 4`, { type: QueryTypes.SELECT });
            const ideaStatusData = await db.query(`SELECT 
    team_id, status
FROM
    challenge_responses`, { type: QueryTypes.SELECT });
            const userTopicData = await db.query(`SELECT 
    COUNT(*) AS user_count, user_id
FROM
    user_topic_progress
GROUP BY user_id`, { type: QueryTypes.SELECT });

            data['summary'] = summary;
            data['teamData'] = teamData;
            data['mentorData'] = mentorData;
            data['mentorUsername'] = mentorUsername;
            data['preSurvey'] = preSurvey;
            data['postSurvey'] = postSurvey;
            data['ideaStatusData'] = ideaStatusData;
            data['userTopicData'] = userTopicData;

            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        } catch (err) {
            next(err)
        }
    }

}
