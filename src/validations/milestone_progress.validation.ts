import Joi from 'joi';
import { constents } from '../configs/constents.config';

export const milestoneProgress = Joi.object().keys({
    milestone_id: Joi.number(),
    challenge_response_id: Joi.number(),
    file: Joi.string(),
    note: Joi.string(),
    status: Joi.string().valid(...Object.values(constents.task_status_flags.list))
});

export const milestoneProgressUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.task_status_flags.list)),
    file: Joi.string(),
    note: Joi.string(),
});