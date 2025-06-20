import Joi from 'joi';
import { constents } from '../configs/constents.config';

export const schedule_calladd = Joi.object().keys({
    meet_link: Joi.string().required(),
    timing: Joi.date().required(),
    challenge_response_id: Joi.number().required(),
    stu_accept:Joi.string().valid(...Object.values(constents.final_result_flags.list)),
    status: Joi.string().valid(...Object.values(constents.task_status_flags.list)).required()
});

export const schedule_callUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.task_status_flags.list)),
    stu_accept:Joi.string().valid(...Object.values(constents.final_result_flags.list)),
    mom: Joi.string(),
    meet_link: Joi.string(),
    timing: Joi.date()
});