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
        this.router.get(this.path + "/studentsummary", this.studentsummary.bind(this));
        this.router.get(this.path + "/studentRegList", this.studentRegDetails.bind(this));
        this.router.get(this.path + "/instsummary", this.instsummary.bind(this));
        this.router.get(this.path + "/instRegList", this.institutionRegDetails.bind(this));
        this.router.get(`${this.path}/instdetailstable`, this.getmentorDetailstable.bind(this));
        this.router.get(`${this.path}/instdetailsreport`, this.getmentorDetailsreport.bind(this));
        this.router.get(`${this.path}/studentdetailstable`, this.getstudentDetailstable.bind(this));
        this.router.get(`${this.path}/studentdetailsreport`, this.getstudentDetailsreport.bind(this));
        this.router.get(`${this.path}/ideadeatilreport`, this.getideaReport.bind(this));
        this.router.get(`${this.path}/ideaReportTable`, this.getideaReportTable.bind(this));
    }
    protected async studentsummary(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let cat_gender
            const categorydata = await db.query(`SELECT DISTINCT
                college_type
            FROM
                students;`, { type: QueryTypes.SELECT });
            const querystring: any = await this.authService.combinecategory(categorydata);
            cat_gender = await db.query(`
                                SELECT district,${querystring.combilequery} count(student_id) as studentReg FROM students group by district;
                                `, { type: QueryTypes.SELECT });
            data = cat_gender
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
    protected async studentRegDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
            const { district, college_type } = newREQQuery;

            let districtFilter: any = `'%%'`
            let categoryFilter: any = `'%%'`

            if (district !== 'All Districts' && district !== undefined) {
                districtFilter = `'${district}'`
            }
            if (college_type !== 'All Types' && college_type !== undefined) {
                categoryFilter = `'${college_type}'`
            }

            const stuReglist = await db.query(`SELECT 
    s.full_name,
    mobile,
    username,
    district,
    college_type,
    college_name,
    roll_number,
    id_number,
    branch,
    year_of_study
FROM
    students AS s
        LEFT JOIN
    users AS u ON s.user_id = u.user_id
    where s.status='ACTIVE' and district LIKE ${districtFilter} and college_type LIKE ${categoryFilter};`, { type: QueryTypes.SELECT });
            if (!stuReglist) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (stuReglist instanceof Error) {
                throw stuReglist
            }
            res.status(200).send(dispatcher(res, stuReglist, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async instsummary(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let cat_gender
            const categorydata = await db.query(`SELECT DISTINCT
                college_type
            FROM
                mentors;`, { type: QueryTypes.SELECT });
            const querystring: any = await this.authService.combinecategory(categorydata);
            cat_gender = await db.query(`
                                SELECT district,${querystring.combilequery} count(mentor_id) as instReg FROM mentors group by district;
                                `, { type: QueryTypes.SELECT });
            data = cat_gender
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
    protected async institutionRegDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
            const { district, college_type } = newREQQuery;

            let districtFilter: any = `'%%'`
            let categoryFilter: any = `'%%'`

            if (district !== 'All Districts' && district !== undefined) {
                districtFilter = `'${district}'`
            }
            if (college_type !== 'All Types' && college_type !== undefined) {
                categoryFilter = `'${college_type}'`
            }

            const insReglist = await db.query(`SELECT 
    m.full_name,
    username,
    mobile,
    district,
    college_type,
    college_name
FROM
    mentors AS m
        JOIN
    users AS u ON m.user_id = u.user_id
WHERE
    m.status = 'ACTIVE' and district LIKE ${districtFilter} and college_type LIKE ${categoryFilter};`, { type: QueryTypes.SELECT });
            if (!insReglist) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (insReglist instanceof Error) {
                throw insReglist
            }
            res.status(200).send(dispatcher(res, insReglist, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getmentorDetailstable(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {

            const data = await db.query(`SELECT 
    m.district,
    COUNT(mentor_id) AS insReg,
    COUNT(student_id) AS studentReg,
    COUNT(CASE
        WHEN s.type = 0 THEN 1
    END) AS 'teamCount'
FROM
    mentors AS m
        LEFT JOIN
    students AS s ON m.college_name = s.college_name
WHERE
    m.status = 'ACTIVE'
GROUP BY m.district`, { type: QueryTypes.SELECT });

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
            const summary = await db.query(`SELECT 
    district, COUNT(student_id) AS totalstudent
FROM
    students
GROUP BY district`, { type: QueryTypes.SELECT });

            const courseCompleted = await db.query(`SELECT 
            st.district,count(st.student_id) as studentCourseCMP
        FROM
            students AS st
                JOIN
            (SELECT 
                user_id, COUNT(*)
            FROM
                user_topic_progress
            GROUP BY user_id
            HAVING COUNT(*) >= ${baseConfig.STUDENT_COURSE}) AS temp ON st.user_id = temp.user_id WHERE st.status='ACTIVE' group by st.district`, { type: QueryTypes.SELECT });
            const courseINprogesss = await db.query(`SELECT 
            st.district,count(st.student_id) as studentCourseIN
        FROM
            students AS st
                JOIN
            (SELECT 
                user_id, COUNT(*)
            FROM
                user_topic_progress
            GROUP BY user_id
            HAVING COUNT(*) < ${baseConfig.STUDENT_COURSE}) AS temp ON st.user_id = temp.user_id WHERE st.status='ACTIVE' group by st.district`, { type: QueryTypes.SELECT });
            const submittedCount = await db.query(`SELECT 
            st.district,count(st.student_id) as submittedCount
        FROM
            students AS st
                JOIN
            (SELECT 
                student_id, status
            FROM
                challenge_responses
            WHERE
                status = 'SUBMITTED') AS temp ON st.student_id = temp.student_id WHERE st.status='ACTIVE' group by st.district`, { type: QueryTypes.SELECT });
            const draftCount = await db.query(`SELECT 
            st.district,count(st.student_id) as submittedCount
        FROM
            students AS st
                JOIN
            (SELECT 
                student_id, status
            FROM
                challenge_responses
            WHERE
                status = 'DRAFT') AS temp ON st.student_id = temp.student_id WHERE st.status='ACTIVE' group by st.district`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
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
            const { college_type, district } = newREQQuery;
            let districtFilter: any = ''
            let categoryFilter: any = ''
            if (district !== 'All Districts' && college_type !== 'All Types') {
                districtFilter = `'${district}'`
                categoryFilter = `'${college_type}'`
            } else if (district !== 'All Districts') {
                districtFilter = `'${district}'`
                categoryFilter = `'%%'`
            } else if (college_type !== 'All Types') {
                categoryFilter = `'${college_type}'`
                districtFilter = `'%%'`
            }
            else {
                districtFilter = `'%%'`
                categoryFilter = `'%%'`
            }
            const summary = await db.query(`SELECT 
    college_name,
    college_type,
    district,
    m.full_name,
    mobile,
    username
FROM
    mentors AS m
        JOIN
    users AS u ON m.user_id = u.user_id
WHERE
    m.status = 'ACTIVE' && m.district LIKE ${districtFilter} && m.college_type LIKE ${categoryFilter}
            ORDER BY m.district,m.full_name;`, { type: QueryTypes.SELECT });
            const studentCount = await db.query(`SELECT 
    college_name, COUNT(student_id) as stuCount, COUNT(CASE
        WHEN type = 0 THEN 1
    END) AS 'teamCount'
FROM
    students
GROUP BY college_name;`, { type: QueryTypes.SELECT });
            const StudentCourseCmp = await db.query(`SELECT 
    COUNT(*) AS countop, college_name
FROM
    (SELECT 
        utp.user_id, COUNT(user_topic_progress_id), college_name
    FROM
        user_topic_progress AS utp
    JOIN students AS s ON utp.user_id = s.user_id
    GROUP BY user_id
    HAVING COUNT(user_topic_progress_id) >= ${baseConfig.STUDENT_COURSE}) AS total
GROUP BY college_name`, { type: QueryTypes.SELECT });
            const StudentCourseINpro = await db.query(`SELECT 
    COUNT(*) AS countIN, college_name
FROM
    (SELECT 
        utp.user_id, COUNT(user_topic_progress_id), college_name
    FROM
        user_topic_progress AS utp
    JOIN students AS s ON utp.user_id = s.user_id
    GROUP BY user_id
    HAVING COUNT(user_topic_progress_id) < ${baseConfig.STUDENT_COURSE}) AS total
GROUP BY college_name`, { type: QueryTypes.SELECT });
            const StuIdeaSubCount = await db.query(`SELECT 
    COUNT(challenge_response_id) AS submittedcout, college_name
FROM
    challenge_responses as cr join students as s ON cr.student_id = s.student_id
WHERE
    cr.status = 'SUBMITTED'
GROUP BY college_name`, { type: QueryTypes.SELECT });
            const StuIdeaDraftCount = await db.query(`SELECT 
    COUNT(challenge_response_id) AS draftcout, college_name
FROM
    challenge_responses as cr join students as s ON cr.student_id = s.student_id
WHERE
    cr.status = 'DRAFT'
GROUP BY college_name`, { type: QueryTypes.SELECT });

            data['summary'] = summary;
            data['studentCount'] = studentCount;
            data['StudentCourseCmp'] = StudentCourseCmp;
            data['StudentCourseINpro'] = StudentCourseINpro;
            data['StuIdeaSubCount'] = StuIdeaSubCount;
            data['StuIdeaDraftCount'] = StuIdeaDraftCount;
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
            const { college_type, district } = newREQQuery;
            let districtFilter: any = ''
            let categoryFilter: any = ''
            if (district !== 'All Districts' && college_type !== 'All Types') {
                districtFilter = `'${district}'`
                categoryFilter = `'${college_type}'`
            } else if (district !== 'All Districts') {
                districtFilter = `'${district}'`
                categoryFilter = `'%%'`
            } else if (college_type !== 'All Types') {
                categoryFilter = `'${college_type}'`
                districtFilter = `'%%'`
            }
            else {
                districtFilter = `'%%'`
                categoryFilter = `'%%'`
            }
            const summary = await db.query(`SELECT 
    student_id,
    s.full_name as studentfullname,
    s.user_id,
    mobile,
    district,
    college_type,
    college_name,
    roll_number,
    id_number,
    branch,
    year_of_study
FROM
    students as s
WHERE
    s.status = 'ACTIVE' && s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} order by s.district`, { type: QueryTypes.SELECT });
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
    student_id, status
FROM
    challenge_responses`, { type: QueryTypes.SELECT });
            const userTopicData = await db.query(`SELECT 
    COUNT(*) AS user_count, user_id
FROM
    user_topic_progress
GROUP BY user_id`, { type: QueryTypes.SELECT });

            data['summary'] = summary;
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
    protected async getideaReportTable(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            let summary
            summary = await db.query(`SELECT 
    s.district,
    COUNT(*) AS totalSubmited,
    COUNT(CASE
        WHEN cal.theme = 'Sustainable Development and Environment' THEN 1
    END) AS SustainableDevelopmentandEnvironment,
    COUNT(CASE
        WHEN cal.theme = 'Digital Transformation' THEN 1
    END) AS DigitalTransformation,
    COUNT(CASE
        WHEN cal.theme = 'Health and Well-being' THEN 1
    END) AS HealthandWellbeing,
    COUNT(CASE
        WHEN cal.theme = 'Quality Education' THEN 1
    END) AS QualityEducation,
    COUNT(CASE
        WHEN cal.theme = 'Economic Empowerment' THEN 1
    END) AS EconomicEmpowerment,
    COUNT(CASE
        WHEN cal.theme = 'Smart and Resilient Communities' THEN 1
    END) AS SmartandResilientCommunities,
    COUNT(CASE
        WHEN cal.theme = 'Agriculture and Rural Development' THEN 1
    END) AS AgricultureandRuralDevelopment,
    COUNT(CASE
        WHEN cal.theme = 'Others' THEN 1
    END) AS OTHERS
FROM
    challenge_responses AS cal
        JOIN
    students AS s ON cal.student_id = s.student_id
WHERE
    cal.status = 'SUBMITTED'
GROUP BY s.district`, { type: QueryTypes.SELECT });
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
    protected async getideaReport(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
            const { district, theme, college_type } = newREQQuery;
            let districtFilter: any = `'%%'`
            let categoryFilter: any = `'%%'`
            let themesFilter: any = `'%%'`
            if (district !== 'All Districts' && district !== undefined) {
                districtFilter = `'${district}'`
            }
            if (college_type !== 'All Types' && college_type !== undefined) {
                categoryFilter = `'${college_type}'`
            }
            if (theme !== 'All Themes' && theme !== undefined) {
                themesFilter = `'${theme}'`
            }

            const summary = await db.query(`SELECT 
    theme,
    idea_describe,
    title,
    solve,
    customer,
    detail,
    stage,
\`unique\`,
    similar,
    revenue,
    society,
    confident,
    support,
    prototype_image,
    prototype_link,
    cal.status,
    cal.student_id,
    s.full_name as studentfullname,
    mobile,
    s.district,
    college_type,
    college_name,
    roll_number,
    id_number,
    branch,
    year_of_study
FROM
    challenge_responses as cal join students as s on cal.student_id = s.student_id 
WHERE
   s.status = 'ACTIVE' && cal.status = 'SUBMITTED' && s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} && cal.theme LIKE ${themesFilter};`, { type: QueryTypes.SELECT });

            data['summary'] = summary;
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
}
