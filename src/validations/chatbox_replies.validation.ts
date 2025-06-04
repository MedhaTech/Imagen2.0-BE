import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const chatbox_replies = Joi.object().keys({
    chatbox_replie_id: Joi.number().required().messages({
        'string.empty': speeches.ID_REQUIRED
    })
});

export const chatbox_repliesUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).messages({
        'any.only': speeches.NOTIFICATION_STATUS_INVALID,
        'string.empty': speeches.NOTIFICATION_STATUS_REQUIRED
    })
});