import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const mentorshipSchema = Joi.object().keys({
    username: Joi.string().trim().min(1).required().email().messages({
        'string.empty': speeches.USER_USERNAME_REQUIRED
    }),
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).required().messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    areas_of_expertise: Joi.string().trim().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().trim().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN)
});

export const mentorshipUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)),
    username: Joi.string().trim().min(1).email().messages({
        'string.empty': speeches.USER_USERNAME_REQUIRED
    }),
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    areas_of_expertise: Joi.string().trim().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().trim().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN)
});
