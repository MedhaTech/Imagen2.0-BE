import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const challengeResponsesUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.evaluation_status.list)).required().messages({
        'any.only': speeches.EVALUATOR_STATUS_INVALID,
        'string.empty': speeches.EVALUATOR_STATUS_REQUIRED
    }),
    'rejected_reason': Joi.any(),
    'rejected_reasonSecond': Joi.any()
});
export const UpdateAnyFieldSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.challenges_flags.list)).messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    }),
    initiated_by: Joi.number(),
    theme: Joi.string(),
    others: Joi.string(),
    idea_describe: Joi.string(),
    title: Joi.string(),
    solve: Joi.string(),
    customer: Joi.string(),
    detail: Joi.string(),
    stage: Joi.string(),
    unique: Joi.string(),
    similar: Joi.string(),
    revenue: Joi.string(),
    society: Joi.string(),
    confident: Joi.string(),
    prototype_image: Joi.string(),
    prototype_link: Joi.string(),
    support: Joi.string(),
    verified_status: Joi.string(),
    verified_at: Joi.date(),
    mentor_rejected_reason: Joi.string(),
    evaluated_by: Joi.number().min(1),
    evaluated_at: Joi.date(),
    rejected_reason: Joi.string(),
    rejected_reasonSecond: Joi.string(),
    district: Joi.string(),
    state: Joi.string(),
    final_result: Joi.string()
});
export const initiateIdeaSchema = Joi.object().keys({
    theme: Joi.string().required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
    }),
    idea_describe: Joi.string().required(),
    title: Joi.string().required(),
    solve: Joi.string().required(),
    customer: Joi.string(),
    detail: Joi.string(),
    stage: Joi.string(),
    unique: Joi.string(),
    similar: Joi.string(),
    revenue: Joi.string(),
    society: Joi.string(),
    confident: Joi.string(),
    prototype_image: Joi.string(),
    others: Joi.string(),
    prototype_link: Joi.string(),
    support: Joi.string(),
    state:Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    district:Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    initiated_by:Joi.number()
});
export const challengeResponsesSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.challenges_flags.list)).required().messages({
        'any.only': speeches.COMMON_STATUS_INVALID,
        'string.empty': speeches.COMMON_STATUS_REQUIRED
    }),
    theme: Joi.any(),
    others: Joi.any(),
    state: Joi.string(),
    district: Joi.string(),
    idea_describe: Joi.any()
});