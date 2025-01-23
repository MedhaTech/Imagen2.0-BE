import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const discussionForumsReplies = Joi.object().keys({
    discussion_forum_id: Joi.number().required().messages({
        'string.empty': speeches.ID_REQUIRED
    }),
    reply_details: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.QUERY_DETAILS
    }),
    file:Joi.string(),
    link:Joi.string()
});

export const discussionForumsRepliesUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).messages({
        'any.only': speeches.NOTIFICATION_STATUS_INVALID,
        'string.empty': speeches.NOTIFICATION_STATUS_REQUIRED
    })
});