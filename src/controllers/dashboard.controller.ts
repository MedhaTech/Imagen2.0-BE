import { Request, Response, NextFunction } from 'express';
import { speeches } from '../configs/speeches.config';
import dispatcher from '../utils/dispatch.util';
import BaseController from './base.controller';
import ValidationsHolder from '../validations/validationHolder';
import db from "../utils/dbconnection.util";
import { QueryTypes } from 'sequelize';
import { dashboard_map_stat } from '../models/dashboard_map_stat.model';
import DashboardService from '../services/dashboard.service';
import { constents } from '../configs/constents.config';
import { notFound } from 'boom';
import { student } from '../models/student.model';
import { baseConfig } from "../configs/base.config";
import { Op } from 'sequelize';


export default class DashboardController extends BaseController {
    model = ""; ///this u will override in every function in this controller ...!!!

    protected initializePath(): void {
        this.path = '/dashboard';
    }
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(null, null);
    }
    protected initializeRoutes(): void {

        ///map stats
        this.router.get(`${this.path}/mapStats`, this.getMapStats.bind(this))
        this.router.get(`${this.path}/refreshMapStats`, this.refreshMapStats.bind(this))
        //student Stats...
        this.router.get(`${this.path}/stuCourseStats`, this.getStudentCourse.bind(this));
        this.router.get(`${this.path}/stuVideoStats`, this.getStudentVideo.bind(this));
        this.router.get(`${this.path}/stuQuizStats`, this.getStudentQUIZ.bind(this));
        this.router.get(`${this.path}/stuBadgesStats`, this.getStudentBadges.bind(this));
        this.router.get(`${this.path}/stuPrePostStats`, this.getStudentPREPOST.bind(this));
        //team stats..
        this.router.get(`${this.path}/teamStats/:student_id`, this.getTeamStats.bind(this));
        //evaluator stats..
        this.router.get(`${this.path}/evaluatorStats`, this.getEvaluatorStats.bind(this));
        //quizscore
        this.router.get(`${this.path}/quizscores`, this.getUserQuizScores.bind(this));
        //singledashboard mentor api's 
        this.router.get(`${this.path}/ideaCount`, this.getideaCount.bind(this));
        this.router.get(`${this.path}/mentorpercentage`, this.getmentorpercentage.bind(this));
        this.router.get(`${this.path}/mentorSurveyStatus`, this.getmentorSurveyStatus.bind(this));
        this.router.get(`${this.path}/whatappLink`, this.getWhatappLink.bind(this));
        this.router.get(`${this.path}/teamCredentials`, this.getteamCredentials.bind(this));
        //singledashboard common api's 
        this.router.get(`${this.path}/teamCount`, this.getteamCount.bind(this));
        this.router.get(`${this.path}/studentCount`, this.getstudentCount.bind(this));
        //singledashboard admin api's
        this.router.get(`${this.path}/studentCourseCount`, this.getstudentCourseCount.bind(this));
        this.router.get(`${this.path}/ideasCount`, this.getideasCount.bind(this));
        this.router.get(`${this.path}/mentorCount`, this.getmentorCount.bind(this));
        this.router.get(`${this.path}/totalQuizSurveys`, this.getTotalQuizSurveys.bind(this));
        //State DashBoard stats
        this.router.get(`${this.path}/StateDashboard`, this.getStateDashboard.bind(this));
        //public api's
        this.router.get(`${this.path}/CollegeNameForCollegeTypeDistrict`, this.getCollegeNameForCollegeType.bind(this));

    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// TEAM STATS
    ///////// PS: this assumes that there is only course in the systems and hence alll topics inside topics table are taken for over counts
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    private async getTeamStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STUDENT' && res.locals.role !== 'TEAM' && res.locals.role !== 'STATE') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            const newParams: any = await this.authService.decryptGlobal(req.params.student_id);
            const student_id = JSON.parse(newParams);
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const paramStatus: any = newREQQuery.status;
            let whereClauseStatusPart: any = {};
            let whereClauseStatusPartLiteral = "1=1";
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPart = { "status": paramStatus }
                whereClauseStatusPartLiteral = `status = "${paramStatus}"`
                addWhereClauseStatusPart = true;
            }

            const serviceDashboard = new DashboardService();
            const studentStatsResul: any = await student.findAll({
                where: {
                    [Op.or]: [
                        { student_id: student_id },
                        { type: student_id }
                    ]
                },
                raw: true,
                attributes: [
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcsCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_topics_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcVideosCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_videos_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcWorksheetCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_worksheets_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcQuizCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_quiz_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "topics_completed_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForVideoToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "videos_completed_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForWorksheetToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "worksheet_completed_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForQuizToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "quiz_completed_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForPreSurveyStatus(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "pre_survey_status"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForPostSurveyStatus(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "post_survey_status"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralIdeaSubmission(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "idea_submission"
                    ],
                    "certificate",
                    "badges",
                    "created_at",
                    "full_name",
                    "user_id"
                ]
            })
            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }

            studentStatsResul.map(async (item: any, index: any) => {
                studentStatsResul[index]['idea_submission'] = studentStatsResul[0]['idea_submission']
            })

            const badges = studentStatsResul.badges;
            let badgesCount = 0
            if (badges) {
                const badgesParsed = JSON.parse(badges);
                if (badgesParsed) {
                    badgesCount = Object.keys(badgesParsed).length
                }
                delete studentStatsResul.badges;
            }
            studentStatsResul["badges_earned_count"] = badgesCount;

            res.status(200).send(dispatcher(res, studentStatsResul, "success"))

        } catch (err) {
            next(err)
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// MAPP STATS
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    private async refreshMapStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const service = new DashboardService()
            const result = await service.resetMapStats()
            res.status(200).json(dispatcher(res, result, "success"))
        } catch (err) {
            next(err);
        }
    }
    private async getMapStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            this.model = dashboard_map_stat.name
            const result = await this.crudService.findAll(dashboard_map_stat, {
                attributes: [
                    "dashboard_map_stat_id",
                    "district_name",
                    "reg_mentors",
                    "teams",
                    "students",
                    "ideas"
                ],
            }
            )
            const TotalObj: any = {
                reg_mentors: 0,
                teams: 0,
                students: 0,
                ideas: 0,
                district_name: "all"
            };
            result.map((student: any) => {
                TotalObj.reg_mentors += Number(student.reg_mentors)
                TotalObj.teams += Number(student.teams)
                TotalObj.students += Number(student.students)
                TotalObj.ideas += Number(student.ideas)
            })
            const totalResult = [...result, TotalObj]
            return res.status(200).send(dispatcher(res, totalResult, 'success'));
        } catch (error) {
            next(error);
        }
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ///////// EVALUATOR STATS
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    protected async getEvaluatorStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let response: any = {};
            const submitted_count = await db.query("SELECT count(challenge_response_id) as 'submitted_count' FROM challenge_responses where status = 'SUBMITTED'", { type: QueryTypes.SELECT });
            const selected_round_one_count = await db.query("SELECT count(challenge_response_id) as 'selected_round_one_count' FROM challenge_responses where evaluation_status = 'SELECTEDROUND1'", { type: QueryTypes.SELECT });
            const rejected_round_one_count = await db.query("SELECT count(challenge_response_id) as 'rejected_round_one_count' FROM challenge_responses where evaluation_status = 'REJECTEDROUND1'", { type: QueryTypes.SELECT });
            const l2_yet_to_processed = await db.query("SELECT COUNT(*) AS l2_yet_to_processed FROM l1_accepted;", { type: QueryTypes.SELECT });
            const l2_processed = await db.query(`SELECT challenge_response_id, count(challenge_response_id) AS l2_processed FROM evaluator_ratings group by challenge_response_id HAVING COUNT(challenge_response_id) >= ${baseConfig.EVAL_FOR_L2}`, { type: QueryTypes.SELECT });
            const draft_count = await db.query("SELECT count(challenge_response_id) as 'draft_count' FROM challenge_responses where status = 'DRAFT'", { type: QueryTypes.SELECT });
            const final_challenges = await db.query("SELECT count(challenge_response_id) as 'final_challenges' FROM evaluation_results where status = 'ACTIVE'", { type: QueryTypes.SELECT });
            const l1_yet_to_process = await db.query(`SELECT COUNT(challenge_response_id) AS l1YetToProcess FROM challenge_responses WHERE status = 'SUBMITTED' AND evaluation_status is NULL OR evaluation_status = ''`, { type: QueryTypes.SELECT });
            const final_evaluation_challenge = await db.query(`SELECT COUNT(challenge_response_id) FROM challenge_responses WHERE final_result = '0'`, { type: QueryTypes.SELECT });
            const final_evaluation_final = await db.query(`SELECT COUNT(challenge_response_id) FROM challenge_responses WHERE final_result = '1'`, { type: QueryTypes.SELECT });
            if (submitted_count instanceof Error) {
                throw submitted_count
            }
            if (selected_round_one_count instanceof Error) {
                throw selected_round_one_count
            }
            if (rejected_round_one_count instanceof Error) {
                throw rejected_round_one_count
            };
            if (l2_yet_to_processed instanceof Error) {
                throw l2_yet_to_processed
            };
            if (l2_processed instanceof Error) {
                throw l2_processed
            };
            if (draft_count instanceof Error) {
                throw draft_count
            };
            if (final_challenges instanceof Error) {
                throw final_challenges
            };
            if (l1_yet_to_process instanceof Error) {
                throw l1_yet_to_process
            };
            if (final_evaluation_challenge instanceof Error) {
                throw final_evaluation_challenge
            };
            if (final_evaluation_final instanceof Error) {
                throw final_evaluation_final
            };
            response['draft_count'] = Object.values(draft_count[0]).toString();
            response['submitted_count'] = Object.values(submitted_count[0]).toString()
            response['l1_yet_to_process'] = Object.values(l1_yet_to_process[0]).toString();
            response['selected_round_one_count'] = Object.values(selected_round_one_count[0]).toString()
            response["rejected_round_one_count"] = Object.values(rejected_round_one_count[0]).toString()
            response["l2_processed"] = (l2_processed.length).toString()
            response["l2_yet_to_processed"] = Object.values(l2_yet_to_processed[0]).toString()
            response['final_challenges'] = Object.values(final_challenges[0]).toString();
            response['final_evaluation_challenge'] = Object.values(final_evaluation_challenge[0]).toString();
            response['final_evaluation_final'] = Object.values(final_evaluation_final[0]).toString();
            res.status(200).send(dispatcher(res, response, "success"))
        } catch (err) {
            next(err)
        }
    }
    //fetching single user quiz score by user_id
    protected async getUserQuizScores(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'EADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'STATE') {
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
            const { user_id, role } = newREQQuery
            const quizscores = await db.query(`SELECT user_id,quiz_id,attempts,score FROM quiz_responses where user_id = ${user_id}`, { type: QueryTypes.SELECT })
            result['scores'] = quizscores
            if (role === "MENTOR") {
                const currentProgress = await db.query(`SELECT count(*)as currentValue FROM mentor_topic_progress where user_id = ${user_id}`, { type: QueryTypes.SELECT })
                result['currentProgress'] = Object.values(currentProgress[0]).toString()
                result['totalProgress'] = baseConfig.MENTOR_COURSE
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting team count for the Institution & all
    protected async getteamCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            const { college_name } = newREQQuery
            if (college_name) {
                result = await db.query(`SELECT 
     COUNT(CASE
        WHEN type = 0 THEN 1
    END) AS 'teamCount'
FROM
    students where college_name = '${college_name}'`, { type: QueryTypes.SELECT });
            }
            else {
                result = await db.query(`SELECT 
    COUNT(CASE
        WHEN type = 0 THEN 1
    END) AS 'teamCount'
FROM
    students
WHERE
    status = 'ACTIVE';`, { type: QueryTypes.SELECT });

            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting student count for the Institution, & all
    protected async getstudentCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            const { college_name } = newREQQuery
            if (college_name) {
                result = await db.query(`SELECT count(student_id) as student_count FROM students where college_name = '${college_name}';`, { type: QueryTypes.SELECT });
            }
            else {
                result = await db.query(`SELECT count(student_id) as student_count FROM students where status = "ACTIVE"`, { type: QueryTypes.SELECT });
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting ideas count for the Institution
    protected async getideaCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            const { college_name } = newREQQuery
            if (college_name) {
                result = await db.query(`SELECT count(challenge_response_id) as idea_count FROM challenge_responses join students on challenge_responses.student_id = students.student_id where students.college_name = '${college_name}' && challenge_responses.status = 'SUBMITTED';`, { type: QueryTypes.SELECT });
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting Institution course percentage
    protected async getmentorpercentage(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            if (user_id) {
                const currentProgress = await db.query(`SELECT count(*) as course_completed_count FROM mentor_topic_progress where user_id = ${user_id};`, { type: QueryTypes.SELECT });
                result['currentProgress'] = Object.values(currentProgress[0]).toString()
                result['totalProgress'] = baseConfig.MENTOR_COURSE
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting mentInstitutionor survey stats (pre and post)
    protected async getmentorSurveyStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            if (user_id) {
                const preSurvey = await db.query(`SELECT count(*) as preSurvey FROM quiz_survey_responses where quiz_survey_id =1 and user_id = ${user_id};`, { type: QueryTypes.SELECT });
                const postSurvey = await db.query(`SELECT count(*) as postSurvey FROM quiz_survey_responses where quiz_survey_id =3 and user_id = ${user_id};`, { type: QueryTypes.SELECT });
                if (Object.values(preSurvey[0]).toString() === '1') {
                    result['preSurvey'] = "COMPLETED"
                } else
                    result['preSurvey'] = "INCOMPLETED"
                if (Object.values(postSurvey[0]).toString() === '1') {
                    result['postSurvey'] = "COMPLETED"
                } else
                    result['postSurvey'] = "INCOMPLETED"
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fecting state specific details
    protected async getWhatappLink(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            const { state_name } = newREQQuery
            if (state_name) {
                const preSurvey = await db.query(`SELECT whatapp_link FROM state_coordinators where state_name like "${state_name}";`, { type: QueryTypes.SELECT });
                result = Object.values(preSurvey[0]).toString()
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching team login details for Institution
    protected async getteamCredentials(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
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
            const { mentor_id, email } = newREQQuery
            if (mentor_id) {
                const teamList = await db.query(`SELECT teams.team_id,team_name,(SELECT username FROM users WHERE user_id = teams.user_id) AS username FROM teams WHERE mentor_id = ${mentor_id} GROUP BY teams.team_id ORDER BY team_id DESC`, { type: QueryTypes.SELECT });
                result = await this.authService.triggerteamDeatils(teamList, email);
            }
            return res.status(200).send(dispatcher(res, result, 'success'));
        }
        catch (err) {
            next(err)
        }
    }
    //fetching student course count
    protected async getstudentCourseCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};

            const StudentCoursesCompletedCount = await db.query(`SELECT 
    COUNT(st.student_id) AS studentCourseCMP
FROM
    students AS st
        JOIN
    (SELECT 
        user_id, COUNT(*)
    FROM
        user_topic_progress
    GROUP BY user_id
    HAVING COUNT(*) >=  ${baseConfig.STUDENT_COURSE}) AS temp ON st.user_id = temp.user_id
WHERE
    st.status = 'ACTIVE';`, { type: QueryTypes.SELECT });
            const started = await db.query(`SELECT 
    COUNT(st.student_id) AS studentCoursestartted
FROM
    students AS st
        JOIN
    (SELECT DISTINCT
        user_id
    FROM
        user_topic_progress) AS temp ON st.user_id = temp.user_id
WHERE
    st.status = 'ACTIVE';`, { type: QueryTypes.SELECT });
            result['StudentCoursesCompletedCount'] = Object.values(StudentCoursesCompletedCount[0]).toString()
            result['started'] = Object.values(started[0]).toString()
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching ideas count for all
    protected async getideasCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};

            const fullCount = await db.query(`SELECT 
    COUNT(st.student_id) AS initiated
FROM
    students AS st
        JOIN
    (SELECT 
        student_id, status
    FROM
        challenge_responses) AS temp ON st.student_id = temp.student_id
WHERE
    st.status = 'ACTIVE'`, { type: QueryTypes.SELECT });
            const submittedCount = await db.query(`SELECT 
    COUNT(st.student_id) AS submittedCount
FROM
    students AS st
        JOIN
    (SELECT 
        student_id, status
    FROM
        challenge_responses
    WHERE
        status = 'SUBMITTED') AS temp ON st.student_id = temp.student_id
WHERE
    st.status = 'ACTIVE'`, { type: QueryTypes.SELECT })
            result['initiated_ideas'] = Object.values(fullCount[0]).toString()
            result['submitted_ideas'] = Object.values(submittedCount[0]).toString()
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching Institution count
    protected async getmentorCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};
            const mentorCount = await db.query(`SELECT 
    COUNT(distinct mn.college_name,mn.college_type) AS totalmentor
FROM
    mentors AS mn
WHERE
    mn.status = 'ACTIVE';`, { type: QueryTypes.SELECT });

            result['mentorCount'] = Object.values(mentorCount[0]).toString()

            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching all count for state
    protected async getStateDashboard(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'STATE') {
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
            let wherefilter = `&& og.state= '${state}'`;
            const summary = await db.query(`SELECT 
                org.state,
                org.ATL_Count,
                org.ATL_Reg_Count,
                org.NONATL_Reg_Count,
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
                COUNT(st.student_id) AS totalstudent
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
            const StudentCourseCompleted = await db.query(`SELECT 
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

            data['orgdata'] = summary;
            data['teamCount'] = teamCount;
            data['studentCountDetails'] = studentCountDetails;
            data['courseCompleted'] = courseCompleted;
            data['StudentCourseCompleted'] = StudentCourseCompleted;
            data['submittedCount'] = submittedCount;
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
    //fetching studetn course count
    protected async getStudentCourse(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STUDENT') {
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

            const userId = newREQQuery.user_id
            const paramStatus = newREQQuery.status;

            let whereClauseStatusPartLiteral = "1=1";
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPartLiteral = `status = "${paramStatus}"`
                addWhereClauseStatusPart = true;
            }

            const serviceDashboard = new DashboardService();
            const studentStatsResul: any = await student.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
                attributes: [
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcsCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_topics_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "topics_completed_count"
                    ],
                ]
            })
            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }
            res.status(200).send(dispatcher(res, studentStatsResul, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching student video count by student id
    protected async getStudentVideo(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STUDENT') {
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

            const userId = newREQQuery.user_id
            const paramStatus = newREQQuery.status;

            let whereClauseStatusPartLiteral = "1=1";
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPartLiteral = `status = "${paramStatus}"`
                addWhereClauseStatusPart = true;
            }

            const serviceDashboard = new DashboardService();
            const studentStatsResul: any = await student.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
                attributes: [
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcVideosCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_videos_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForVideoToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "videos_completed_count"
                    ]
                ]
            })
            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }
            res.status(200).send(dispatcher(res, studentStatsResul, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching student quiz count by student id
    protected async getStudentQUIZ(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STUDENT') {
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

            const userId = newREQQuery.user_id
            const paramStatus = newREQQuery.status;

            let whereClauseStatusPartLiteral = "1=1";
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPartLiteral = `status = "${paramStatus}"`
                addWhereClauseStatusPart = true;
            }

            const serviceDashboard = new DashboardService();
            const studentStatsResul: any = await student.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
                attributes: [
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForAllToipcQuizCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "all_quiz_count"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForQuizToipcsCompletedCount(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "quiz_completed_count"
                    ]
                ]
            })
            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }
            res.status(200).send(dispatcher(res, studentStatsResul, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching student badges by student id
    protected async getStudentBadges(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STUDENT') {
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

            const userId = newREQQuery.user_id

            const studentStatsResul: any = await student.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
                attributes: [
                    "badges"
                ]
            })
            const badges = studentStatsResul.badges;
            let badgesCount = 0
            if (badges) {
                const badgesParsed = JSON.parse(badges);
                if (badgesParsed) {
                    badgesCount = Object.keys(badgesParsed).length
                }
                delete studentStatsResul.badges;
            }
            studentStatsResul["badges_earned_count"] = badgesCount;

            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }
            res.status(200).send(dispatcher(res, studentStatsResul, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching student survey status by student id
    protected async getStudentPREPOST(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR' && res.locals.role !== 'TEAM' && res.locals.role !== 'STUDENT') {
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

            const userId = newREQQuery.user_id
            const paramStatus = newREQQuery.status;

            let whereClauseStatusPartLiteral = "1=1";
            let addWhereClauseStatusPart = false
            if (paramStatus && (paramStatus in constents.common_status_flags.list)) {
                whereClauseStatusPartLiteral = `status = "${paramStatus}"`
                addWhereClauseStatusPart = true;
            }

            const serviceDashboard = new DashboardService();
            const studentStatsResul: any = await student.findOne({
                where: {
                    user_id: userId
                },
                raw: true,
                attributes: [
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForPreSurveyCreatedAt(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "pre_survey_completed_date"
                    ],
                    [
                        db.literal(`(
                            ${serviceDashboard.getDbLieralForPostSurveyCreatedAt(addWhereClauseStatusPart,
                            whereClauseStatusPartLiteral)}
                            )`),
                        "post_survey_completed_date"
                    ]
                ]
            })
            if (!studentStatsResul) {
                throw notFound(speeches.USER_NOT_FOUND)
            }
            if (studentStatsResul instanceof Error) {
                throw studentStatsResul
            }
            res.status(200).send(dispatcher(res, studentStatsResul, "success"))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching total count of student pre survey and student post survey
    protected async getTotalQuizSurveys(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        if (res.locals.role !== 'ADMIN' && res.locals.role !== 'MENTOR') {
            return res.status(401).send(dispatcher(res, '', 'error', speeches.ROLE_ACCES_DECLINE, 401));
        }
        try {
            let result: any = {};
            result = await db.query(`SELECT 
    SUM(CASE
        WHEN qsr.quiz_survey_id = 2 THEN 1
        ELSE 0
    END) AS studentpre,
    SUM(CASE
        WHEN qsr.quiz_survey_id = 4 THEN 1
        ELSE 0
    END) AS studentpost
FROM
    quiz_survey_responses AS qsr`, { type: QueryTypes.SELECT })
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
    //fetching list of college name by college type & district 
    protected async getCollegeNameForCollegeType(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            let result: any = {};
            let newREQQuery: any = {}
            if (req.query.Data) {
                let newQuery: any = await this.authService.decryptGlobal(req.query.Data);
                newREQQuery = JSON.parse(newQuery);
            } else if (Object.keys(req.query).length !== 0) {
                return res.status(400).send(dispatcher(res, '', 'error', 'Bad Request', 400));
            }
            const { college_type, district } = newREQQuery
            if (college_type && district) {
                result = await db.query(`
                    SELECT 
    college_name
FROM
    institutions
WHERE
    college_type = '${college_type}'
        AND UPPER(district) = '${district}'
UNION SELECT 
    college_name
FROM
    students
WHERE
    college_type = '${college_type}'
        AND UPPER(district) = '${district}'
UNION SELECT 
    college_name
FROM
    mentors
WHERE
    college_type = '${college_type}'
        AND UPPER(district) = '${district}'
`, { type: QueryTypes.SELECT });
            }
            else {
                result = await db.query(`
                    SELECT 
    college_name
FROM
    institutions 
UNION SELECT 
    college_name
FROM
    students 
UNION SELECT 
    college_name
FROM
    mentors
                    `, { type: QueryTypes.SELECT });
            }
            res.status(200).send(dispatcher(res, result, 'done'))
        }
        catch (err) {
            next(err)
        }
    }
};