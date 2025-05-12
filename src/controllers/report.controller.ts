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
        this.router.get(this.path + "/instNonRegList", this.institutionNonRegDetails.bind(this));
        this.router.get(`${this.path}/instdetailstable`, this.getmentorDetailstable.bind(this));
        this.router.get(`${this.path}/instdetailsreport`, this.getmentorDetailsreport.bind(this));
        this.router.get(`${this.path}/studentdetailstable`, this.getstudentDetailstable.bind(this));
        this.router.get(`${this.path}/studentdetailsreport`, this.getstudentDetailsreport.bind(this));
        this.router.get(`${this.path}/ideadeatilreport`, this.getideaReport.bind(this));
        this.router.get(`${this.path}/ideaReportTable`, this.getideaReportTable.bind(this));
        this.router.get(`${this.path}/L1ReportTable1`, this.getL1ReportTable1.bind(this));
        this.router.get(`${this.path}/L1ReportTable2`, this.getL1ReportTable2.bind(this));
        this.router.get(`${this.path}/L2ReportTable1`, this.getL2ReportTable1.bind(this));
        this.router.get(`${this.path}/L2ReportTable2`, this.getL2ReportTable2.bind(this));
        this.router.get(`${this.path}/L2ReportTable3`, this.getL2ReportTable3.bind(this));
        this.router.get(`${this.path}/L3ReportTable1`, this.getL3ReportTable1.bind(this));
        this.router.get(`${this.path}/L3ReportTable2`, this.getL3ReportTable2.bind(this));
        this.router.get(`${this.path}/L1deatilreport`, this.getL1Report.bind(this));
        this.router.get(`${this.path}/L2deatilreport`, this.getL2Report.bind(this));
        this.router.get(`${this.path}/L3deatilreport`, this.getL3Report.bind(this));
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
                                SELECT district,${querystring.combilequery} count(student_id) as studentReg FROM students group by district ORDER BY district;
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
    year_of_study,
    college_town,
    gender,
    s.created_at
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
                                SELECT district,${querystring.combilequery} count(mentor_id) as instReg FROM mentors group by district ORDER BY district;
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
    college_name,
    m.created_at
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
    protected async institutionNonRegDetails(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
    s.college_name,
    s.college_type,
    s.district,
    college_town,
    COUNT(student_id) AS studentRegCount
FROM
    Aim_db.students AS s
        LEFT JOIN
    mentors AS m ON s.college_name = m.college_name
WHERE
    m.college_name IS NULL
        AND s.status = 'ACTIVE' AND s.district LIKE ${districtFilter} AND s.college_type LIKE ${categoryFilter}
GROUP BY s.college_name;`, { type: QueryTypes.SELECT });
            if (!insReglist) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (insReglist instanceof Error) {
                throw insReglist
            }
            res.status(200).send(dispatcher(res, insReglist, "success"))
        } catch (err) {
            console.log(err)
            next(err)
        }
    }
    protected async getmentorDetailstable(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'REPORT' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {

            const data = await db.query(`SELECT 
    COALESCE(m.district, s.district) AS district,
    COALESCE(insReg, 0) AS insReg,
    COALESCE(studentReg, 0) AS studentReg,
    COALESCE(teamCount, 0) AS teamCount
FROM
    (SELECT 
        district, COUNT(DISTINCT mentor_id) AS insReg
    FROM
        mentors
    WHERE
        status = 'ACTIVE'
    GROUP BY district) AS m
        JOIN
    (SELECT 
        district,
            COUNT(student_id) AS studentReg,
            COUNT(CASE
                WHEN type = 0 THEN 1
            END) AS teamCount
    FROM
        students
    WHERE
        status = 'ACTIVE'
    GROUP BY district) AS s ON m.district = s.district
ORDER BY district`, { type: QueryTypes.SELECT });

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
GROUP BY district ORDER BY district`, { type: QueryTypes.SELECT });

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
            st.district,count(st.student_id) as draftCount
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
    year_of_study,
    college_town,
    gender,
    s.type,
    (select username from users as u where s.user_id = u.user_id) as email
FROM
    students as s
WHERE
    s.status = 'ACTIVE' && s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} order by s.district`, { type: QueryTypes.SELECT });
            const preSurvey = await db.query(`SELECT 
                CASE
                    WHEN status = 'ACTIVE' THEN 'Completed'
                END AS 'pre_survey_status',
                user_id,
                created_at
            FROM
                quiz_survey_responses
            WHERE
                quiz_survey_id = 2`, { type: QueryTypes.SELECT });
            const postSurvey = await db.query(`SELECT 
    CASE
        WHEN status = 'ACTIVE' THEN 'Completed'
    END AS 'post_survey_status',
    user_id,
    created_at
FROM
    quiz_survey_responses
WHERE
    quiz_survey_id = 4`, { type: QueryTypes.SELECT });
            const ideaStatusData = await db.query(`SELECT 
    student_id, status,submitted_at
FROM
    challenge_responses`, { type: QueryTypes.SELECT });
            const userTopicData = await db.query(`SELECT 
    COUNT(*) AS user_count, user_id,MAX(CASE WHEN course_topic_id = 26 THEN created_at END) AS created_at
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
        WHEN cal.theme = "Smart Automation" THEN 1
    END) AS "SmartAutomation",
    COUNT(CASE
        WHEN cal.theme = "Fitness and Sports" THEN 1
    END) AS "FitnessandSports",
    COUNT(CASE
        WHEN cal.theme = "Heritage and Culture" THEN 1
    END) AS "HeritageandCulture",
    COUNT(CASE
        WHEN cal.theme = "MedTech or BioTech or HealthTech" THEN 1
    END) AS "MedTechorBioTechorHealthTech",
    COUNT(CASE
        WHEN cal.theme = "Agriculture, and Rural Development" THEN 1
    END) AS "AgricultureandRuralDevelopment",
    COUNT(CASE
        WHEN cal.theme = "Smart Vehicles" THEN 1
    END) AS "SmartVehicles",
    COUNT(CASE
        WHEN cal.theme = "Transportation and Logistics" THEN 1
    END) AS "TransportationandLogistics",
    COUNT(CASE
        WHEN cal.theme = "Robotics and Drones" THEN 1
    END) AS "RoboticsandDrones",
    COUNT(CASE
        WHEN cal.theme = "Clean and Green Technology" THEN 1
    END) AS "CleanandGreenTechnology",
    COUNT(CASE
        WHEN cal.theme = "Tourism" THEN 1
    END) AS "Tourism",
    COUNT(CASE
        WHEN cal.theme = "Renewable and sustainable Energy" THEN 1
    END) AS "RenewableandsustainableEnergy",
    COUNT(CASE
        WHEN cal.theme = "Blockchain and Cybersecurity" THEN 1
    END) AS "BlockchainandCybersecurity",
    COUNT(CASE
        WHEN cal.theme = "Smart Education" THEN 1
    END) AS "SmartEducation",
    COUNT(CASE
        WHEN cal.theme = "Disaster Management" THEN 1
    END) AS "DisasterManagement",
    COUNT(CASE
        WHEN cal.theme = "Toys and Games" THEN 1
    END) AS "ToysandGames",
    COUNT(CASE
        WHEN cal.theme = "Miscellaneous" THEN 1
    END) AS "Miscellaneous",
    COUNT(CASE
        WHEN cal.theme = "Space Technology" THEN 1
    END) AS "SpaceTechnology",
    COUNT(CASE
        WHEN cal.theme = "Financial Inclusion and FinTech" THEN 1
    END) AS "FinancialInclusionandFinTech",
    COUNT(CASE
        WHEN cal.theme = "Rural Innovation and Development" THEN 1
    END) AS "RuralInnovationandDevelopment",
    COUNT(CASE
        WHEN cal.theme = "Public Governance and CivicTech" THEN 1
    END) AS "PublicGovernanceandCivicTech",
    COUNT(CASE
        WHEN cal.theme = 'Others' THEN 1
    END) AS OTHERS
FROM
    challenge_responses AS cal
        JOIN
    students AS s ON cal.student_id = s.student_id
WHERE
    cal.status = 'SUBMITTED'
GROUP BY s.district ORDER BY district`, { type: QueryTypes.SELECT });
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
    submitted_at,
    cal.student_id,
    mobile,
    s.district,
    college_type,
    college_name,
    roll_number,
    id_number,
    branch,
    year_of_study,
    s.full_name as Pilot,
    (select full_name from students as st where st.user_id = cal.initiated_by) as initiatedName,
    (select JSON_ARRAYAGG(full_name) from students as st where st.type = cal.student_id) as teamMembers
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
    protected async getL1ReportTable1(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
            const district = newREQQuery.district;
            let wherefilter = '';
            if (district) {
                wherefilter = `WHERE org.district= '${district}'`;
            }
            const summary = await db.query(`SELECT 
            org.district,
            COALESCE(totalSubmited, 0) AS totalSubmited,
            COALESCE(accepted, 0) AS accepted,
            COALESCE(rejected, 0) AS rejected
        FROM
            organizations AS org
                LEFT JOIN
            (SELECT 
                COUNT(*) AS totalSubmited,
                    district,
                    COUNT(CASE
                        WHEN evaluation_status = 'SELECTEDROUND1' THEN 1
                    END) AS accepted,
                    COUNT(CASE
                        WHEN evaluation_status = 'REJECTEDROUND1' THEN 1
                    END) AS rejected
            FROM
                challenge_responses AS cal
            WHERE
                cal.status = 'SUBMITTED'
            GROUP BY district) AS t2 ON org.district = t2.district
            ${wherefilter}
        GROUP BY org.district`, { type: QueryTypes.SELECT });
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
    protected async getL1ReportTable2(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            const summary = await db.query(`SELECT 
            user_id,
            full_name,
            COUNT(evaluated_by) AS totalEvaluated,
            COUNT(CASE
                WHEN evaluation_status = 'SELECTEDROUND1' THEN 1
            END) AS accepted,
            COUNT(CASE
                WHEN evaluation_status = 'REJECTEDROUND1' THEN 1
            END) AS rejected
        FROM
            challenge_responses AS cal
                JOIN
            evaluators AS evl ON cal.evaluated_by = evl.user_id
        WHERE
            cal.status = 'SUBMITTED'
        GROUP BY evaluated_by`, { type: QueryTypes.SELECT });
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
    protected async getL2ReportTable1(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            const summary = await db.query(`SELECT 
            challenge_response_id,
            AVG(overall) AS overall,
            (AVG(param_1) + AVG(param_2)) / 2 AS Quality,
            (AVG(param_3) + AVG(param_4) + AVG(param_5)) / 3 AS Feasibility
        FROM
            evaluator_ratings
        GROUP BY challenge_response_id;
        `, { type: QueryTypes.SELECT });
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
    protected async getL2ReportTable3(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
            const district = newREQQuery.district;
            let wherefilter = '';
            if (district) {
                wherefilter = `WHERE org.district= '${district}'`;
            }
            const summary = await db.query(`SELECT 
    org.district,
    COALESCE(count_1to3,0) as count_1to3,
    COALESCE(count_3to5,0) as count_3to5,
    COALESCE(count_5to6,0) as count_5to6,
    COALESCE(count_6to7,0) as count_6to7,
    COALESCE(count_7to8,0) as count_7to8,
    COALESCE(count_8to9,0) as count_8to9,
    COALESCE(count_9to10,0) as count_9to10
FROM
    organizations AS org
        LEFT JOIN
    (SELECT 
        district,
            COUNT(CASE
                WHEN
                    average_score >= 1
                        AND average_score <= 3
                THEN
                    1
            END) AS count_1to3,
            COUNT(CASE
                WHEN average_score > 3 AND average_score <= 5 THEN 1
            END) AS count_3to5,
            COUNT(CASE
                WHEN average_score > 5 AND average_score <= 6 THEN 1
            END) AS count_5to6,
            COUNT(CASE
                WHEN average_score > 6 AND average_score <= 7 THEN 1
            END) AS count_6to7,
            COUNT(CASE
                WHEN average_score > 7 AND average_score <= 8 THEN 1
            END) AS count_7to8,
            COUNT(CASE
                WHEN average_score > 8 AND average_score <= 9 THEN 1
            END) AS count_8to9,
            COUNT(CASE
                WHEN
                    average_score > 9
                        AND average_score <= 10
                THEN
                    1
            END) AS count_9to10
    FROM
        (SELECT 
        challenge_response_id, AVG(overall) AS average_score
    FROM
        evaluator_ratings
    GROUP BY challenge_response_id
    HAVING COUNT(challenge_response_id) >= 2) AS subquery
    JOIN challenge_responses AS cal ON subquery.challenge_response_id = cal.challenge_response_id
    GROUP BY district) AS final_count ON org.district = final_count.district
     ${wherefilter}
GROUP BY org.district
        `, { type: QueryTypes.SELECT });
            data = summary;
            if (!data) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (data instanceof Error) {
                throw data
            }
            res.status(200).send(dispatcher(res, data, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    protected async getL2ReportTable2(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            const summary = await db.query(`SELECT 
            user_id, full_name, COUNT(*) as totalEvaluated
        FROM
            evaluator_ratings
                JOIN
            evaluators ON evaluator_ratings.evaluator_id = evaluators.user_id
        GROUP BY user_id;`, { type: QueryTypes.SELECT });
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
    protected async getL3ReportTable1(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let data: any = {}
            const summary = await db.query(`
            SELECT 
    cal.challenge_response_id,
    AVG(overall) AS overall,
    (AVG(param_1) + AVG(param_2)) / 2 AS Quality,
    (AVG(param_3) + AVG(param_4) + AVG(param_5)) / 3 AS Feasibility
FROM
    evaluator_ratings AS evl_r
        JOIN
    challenge_responses AS cal ON evl_r.challenge_response_id = cal.challenge_response_id
WHERE
    final_result <> 'null'
GROUP BY challenge_response_id;`, { type: QueryTypes.SELECT });
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
    protected async getL3ReportTable2(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
            const district = newREQQuery.district;
            let wherefilter = '';
            if (district) {
                wherefilter = `WHERE org.district= '${district}'`;
            }
            const summary = await db.query(`SELECT 
            org.district,
            COALESCE((runners + winners),0) AS shortedlisted,
            COALESCE(runners, 0) AS runners,
            COALESCE(winners, 0) AS winners
        FROM
            organizations AS org
                LEFT JOIN
            (SELECT 
                district,
                    COUNT(CASE
                        WHEN final_result = '0' THEN 1
                    END) AS runners,
                    COUNT(CASE
                        WHEN final_result = '1' THEN 1
                    END) AS winners
            FROM
                challenge_responses AS cal
            WHERE
                cal.status = 'SUBMITTED'
            GROUP BY district) AS t2 ON org.district = t2.district
            ${wherefilter}
        GROUP BY org.district`, { type: QueryTypes.SELECT });
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
    protected async getL1Report(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
            const { district, theme, college_type, evaluation_status } = newREQQuery;
            let districtFilter: any = `'%%'`
            let categoryFilter: any = `'%%'`
            let themesFilter: any = `'%%'`
            let evaluationstatusFilter: any = `'%%'`
            if (district !== 'All Districts' && district !== undefined) {
                districtFilter = `'${district}'`
            }
            if (college_type !== 'All Types' && college_type !== undefined) {
                categoryFilter = `'${college_type}'`
            }
            if (theme !== 'All Themes' && theme !== undefined) {
                themesFilter = `'${theme}'`
            }
            if (evaluation_status !== 'Both' && evaluation_status !== undefined) {
                evaluationstatusFilter = `'${evaluation_status}'`
            }
            const summary = await db.query(`SELECT 
    s.district,
    challenge_response_id,
    college_name,
    college_type,
    (select JSON_ARRAYAGG(full_name) from students where student_id = cr.student_id or students.type = cr.student_id) as student_names,
    theme,
    idea_describe,
    title,
    solve,
    customer,
    detail,
    stage,
    cr.unique,
    similar,
    revenue,
    society,
    confident,
    support,
    prototype_image,
    prototype_link,
    evaluation_status,
    cr.status
FROM
    challenge_responses AS cr
        JOIN
    students AS s ON cr.student_id = s.student_id
WHERE
    s.status = 'ACTIVE'
        && evaluation_status IN ('REJECTEDROUND1' , 'SELECTEDROUND1')
		&& s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} && cr.theme LIKE ${themesFilter} && cr.evaluation_status LIKE ${evaluationstatusFilter};`, { type: QueryTypes.SELECT });
            if (!summary) {
                throw notFound(speeches.DATA_NOT_FOUND)
            }
            if (summary instanceof Error) {
                throw summary
            }
            res.status(200).send(dispatcher(res, summary, "success"))
        } catch (err) {
            next(err)
        }
    }
    protected async getL2Report(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
    s.district,
    challenge_response_id,
    college_name,
    college_type,
    (select JSON_ARRAYAGG(full_name) from students where student_id = cr.student_id or students.type = cr.student_id) as student_names,
    theme,
    idea_describe,
    title,
    solve,
    customer,
    detail,
    stage,
    cr.unique,
    similar,
    revenue,
    society,
    confident,
    support,
    prototype_image,
    prototype_link,
    final_result,
    cr.status
FROM
    challenge_responses AS cr
        JOIN
    students AS s ON cr.student_id = s.student_id
WHERE
    s.status = 'ACTIVE'
        && evaluation_status = 'SELECTEDROUND1'
		&& s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} && cr.theme LIKE ${themesFilter};`, { type: QueryTypes.SELECT });

            const evaluatorRatingValues = await db.query(`SELECT 
challenge_response_id,
    AVG(overall) AS overall_score,
    AVG(param_1) AS novelty,
    AVG(param_3) AS feasibility,
    AVG(param_4) AS scalability,
    AVG(param_5) AS sustainability,
    AVG(param_2) AS useful,
    COUNT(challenge_response_id) AS eval_count,
    (AVG(param_1) + AVG(param_2)) / 2 AS quality_score,
    (AVG(param_3) + AVG(param_4) + AVG(param_5)) / 3 AS feasibility_score
FROM
    evaluator_ratings
GROUP BY challenge_response_id`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
            data['evaluatorRatingValues'] = evaluatorRatingValues;
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
    protected async getL3Report(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
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
    s.district,
    challenge_response_id,
    college_name,
    college_type,
    (select JSON_ARRAYAGG(full_name) from students where student_id = cr.student_id or students.type = cr.student_id) as student_names,
    theme,
    idea_describe,
    title,
    solve,
    customer,
    detail,
    stage,
    cr.unique,
    similar,
    revenue,
    society,
    confident,
    support,
    prototype_image,
    prototype_link,
    final_result,
    cr.status
FROM
    challenge_responses AS cr
        JOIN
    students AS s ON cr.student_id = s.student_id
WHERE
    s.status = 'ACTIVE'
        && final_result <>'null'
		&& s.district LIKE ${districtFilter} && s.college_type LIKE ${categoryFilter} && cr.theme LIKE ${themesFilter};`, { type: QueryTypes.SELECT });
            const evaluatorRatingValues = await db.query(`SELECT 
challenge_response_id,
    AVG(overall) AS overall_score,
    AVG(param_1) AS novelty,
    AVG(param_3) AS feasibility,
    AVG(param_4) AS scalability,
    AVG(param_5) AS sustainability,
    AVG(param_2) AS useful,
    (AVG(param_1) + AVG(param_2)) / 2 AS quality_score,
    (AVG(param_3) + AVG(param_4) + AVG(param_5)) / 3 AS feasibility_score
FROM
    evaluator_ratings
GROUP BY challenge_response_id`, { type: QueryTypes.SELECT });
            data['summary'] = summary;
            data['evaluatorRatingValues'] = evaluatorRatingValues;
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
