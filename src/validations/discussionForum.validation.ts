import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const discussionForums = Joi.object().keys({
    query_details: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.QUERY_DETAILS
    }),
    district: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.DISTRICT_REQ
    }),
    file: Joi.string(),
    link: Joi.string()
});

export const discussionForumsUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).messages({
        'any.only': speeches.NOTIFICATION_STATUS_INVALID,
        'string.empty': speeches.NOTIFICATION_STATUS_REQUIRED
    })
});