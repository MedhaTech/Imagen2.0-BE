import BaseService from "./base.service";
import { QueryTypes } from "sequelize";
import db from "../utils/dbconnection.util";

export default class DashboardService extends BaseService {
    /**
     * truncates the data in dashboard map stats tables and re entries
     * @returns Object 
     */
    async resetMapStats() {
        try {
//             const removeData = `truncate dashboard_map_stats;`
//             const DistrictData = `INSERT INTO dashboard_map_stats(district_name)
// select district from organizations group by district`
            const teamData = `UPDATE dashboard_map_stats AS d
        JOIN
    (SELECT 
        COUNT(CASE
                WHEN type = 0 THEN 1
            END) AS 'teamCount',
            district
    FROM
        students
    WHERE
        status = 'ACTIVE'
    GROUP BY district) AS s ON d.district_name = s.district 
SET 
    d.teams = s.teamCount`
            const StudentData = `UPDATE dashboard_map_stats AS d
        JOIN
    (SELECT 
    COUNT(student_id) AS student_count, district
FROM
    students
WHERE
    status = 'ACTIVE'
GROUP BY district) AS s ON d.district_name = s.district 
SET 
    d.students = s.student_count`
            const InstData = `UPDATE dashboard_map_stats AS d
        JOIN
    (SELECT 
        COUNT(mn.mentor_id) AS totalmentor, district
    FROM
        mentors AS mn
    WHERE
        mn.status = 'ACTIVE'
    GROUP BY district) AS s ON d.district_name = s.district 
SET 
    d.reg_mentors = s.totalmentor`
            const IdeaData = `UPDATE dashboard_map_stats AS d
        JOIN
    (SELECT 
        COUNT(st.student_id) AS submittedCount, st.district
    FROM
        students AS st
    JOIN (SELECT 
        student_id, status
    FROM
        challenge_responses
    WHERE
        status = 'SUBMITTED') AS temp ON st.student_id = temp.student_id
    WHERE
        st.status = 'ACTIVE'
    GROUP BY st.district) AS s ON d.district_name = s.district 
SET 
    d.ideas = s.submittedCount`

            // await db.query(removeData, {
            //     type: QueryTypes.RAW,
            // });
            // await db.query(DistrictData, {
            //     type: QueryTypes.RAW,
            // });
            await db.query(teamData, {
                type: QueryTypes.RAW,
            });
            await db.query(StudentData, {
                type: QueryTypes.RAW,
            });
            await db.query(InstData, {
                type: QueryTypes.RAW,
            });
            await db.query(IdeaData, {
                type: QueryTypes.RAW,
            });
            console.log('Student Report SQL queries executed successfully.');
        } catch (error) {
            console.error('Error executing SQL queries:', error);
        }
    }

    // Dashboard student helpers....!!
    /**
     * All course topic count
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForAllToipcsCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
             select count(t.course_topic_id) 
             from course_topics as t
             join course_modules as cm on t.course_module_id = cm.course_module_id where course_id = 1 and 
             ${addWhereClauseStatusPart ? "t." + whereClauseStatusPartLiteral : whereClauseStatusPartLiteral}
             `
    }
    /**
     * All course topic count where topic type is VIDEO
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForAllToipcVideosCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral) +
            `and t.topic_type = "VIDEO"`
    }
    /**
     * All course topic count where topic type is WORKSHEET
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForAllToipcWorksheetCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral) +
            `and t.topic_type = "WORKSHEET"`
    }
    /**
     * All course topic count where topic type is QUIZ
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForAllToipcQuizCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return this.getDbLieralForAllToipcsCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral) +
            `and t.topic_type = "QUIZ"`
    }
    /**
     * Get user_ids who completed Topics
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @param whereOperation String
     * @returns Object
     */
    getDbLieralCommPartToipcsCompletedCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any, whereOperation: any) {
        return `
        select utp.user_id
                from user_topic_progress as utp
                join course_topics as t on t.course_topic_id=utp.course_topic_id
                where 
                1=1
                and utp.user_id=\`student\`.\`user_id\`
                and utp.status = "COMPLETED"
                ${whereOperation}
                group by utp.user_id,utp.course_topic_id
        `
    }
    /**
     * Count completed Topics for user
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForAllToipcsCompletedCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from (
            ${this.getDbLieralCommPartToipcsCompletedCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral, '')}
            ) as count
        `
    }
    /**
     * count for per survey status for student 
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForPreSurveyStatus(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from quiz_survey_responses as preSurvey where preSurvey.user_id = \`student\`.\`user_id\` and preSurvey.quiz_survey_id = 2 is true
        `
    }
    /**
     * count for post survey status for student 
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForPostSurveyStatus(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from quiz_survey_responses as preSurvey where preSurvey.user_id = \`student\`.\`user_id\` and preSurvey.quiz_survey_id = 4 is true
        `
    }
    /**
     * count for idea submission for student
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralIdeaSubmission(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
        select count(*) from challenge_responses as idea where idea.student_id = \`student\`.\`student_id\` and status = "SUBMITTED"
        `
    }
    /**
     * All course topic count where topic type is VIDEO
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForVideoToipcsCompletedCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from (
            ${this.getDbLieralCommPartToipcsCompletedCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral, 'and t.topic_type = "VIDEO"')}
            ) as count
        `
    }
    /**
     * All course topic count where topic type is WORKSHEET
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForWorksheetToipcsCompletedCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from (
            ${this.getDbLieralCommPartToipcsCompletedCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral, ' and t.topic_type = "WORKSHEET"')}
            ) as count
        `
    }
    /**
     * All course topic count where topic type is QUIZ
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForQuizToipcsCompletedCount(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select count(*) from (
            ${this.getDbLieralCommPartToipcsCompletedCount(addWhereClauseStatusPart, whereClauseStatusPartLiteral, 'and t.topic_type = "QUIZ"')}
            ) as count
        `
    }
    /**
     * get created_at for student pre survey user from quiz survey responses
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForPreSurveyCreatedAt(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            SELECT created_at FROM quiz_survey_responses where quiz_survey_id = 2 and user_Id = \`student\`.\`user_id\`
            `
    }
    /**
     * get created_at for student post survey user from quiz survey responses
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForPostSurveyCreatedAt(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            SELECT created_at FROM quiz_survey_responses where quiz_survey_id = 4 and user_Id = \`student\`.\`user_id\`
            `
    }
    /**
     * get created_at for student user from user_topic_progress
     * @param addWhereClauseStatusPart String
     * @param whereClauseStatusPartLiteral String
     * @returns Object
     */
    getDbLieralForCourseCompletedCreatedAt(addWhereClauseStatusPart: any, whereClauseStatusPartLiteral: any) {
        return `
            select created_at from user_topic_progress as utp where 1=1 and  utp.status = "COMPLETED" and course_topic_id = 31 and utp.user_id = \`student\`.\`user_id\` 
        `
    }
}