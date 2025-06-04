import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const milestone_progress = Joi.object().keys({
    milestone_progress_id: Joi.number().required().messages({
        'string.empty': speeches.ID_REQUIRED
    })
});

export const milestone_progressUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)).messages({
        'any.only': speeches.NOTIFICATION_STATUS_INVALID,
        'string.empty': speeches.NOTIFICATION_STATUS_REQUIRED
    })
});