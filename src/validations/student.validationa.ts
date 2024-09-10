import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const studentSchema = Joi.object().keys({
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).required().messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    username: Joi.string().email(),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_type: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    roll_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    branch: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    year_of_study: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    password: Joi.any(),
    confirmPassword: Joi.any()
});
export const studentSchemaAddstudent = Joi.object().keys({
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).required().messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    type:Joi.string().trim().min(1).regex(constents.ONLY_DIGIT_PATTERN).required().messages({
        'string.empty': speeches.USER_TYPE_REQUIRED
    }),
    username: Joi.string().email(),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_type: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    roll_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    branch: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    year_of_study: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    password: Joi.any(),
    confirmPassword: Joi.any()
});

export const studentUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)),
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN),
    Age: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    Grade: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    team_id: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    disability: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    Gender: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN)
});

export const studentLoginSchema = Joi.object().keys({
    username: Joi.string().email().required().messages({
        'string.empty': speeches.USER_USERNAME_REQUIRED
    }),
    password: Joi.string().required().messages({
        'string.empty': speeches.USER_PASSWORD_REQUIRED
    })
});
