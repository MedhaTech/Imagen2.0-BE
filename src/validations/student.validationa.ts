import Joi from 'joi';
import { constents } from '../configs/constents.config';
import { speeches } from '../configs/speeches.config';

export const studentSchema = Joi.object().keys({
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).required().messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    username: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.USER_USERNAME_REQUIRED
    }),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN).allow(null, ''),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_type: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    roll_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    id_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN).allow(null, ''),
    branch: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    year_of_study: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    password: Joi.any(),
    confirmPassword: Joi.any(),
    gender: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    college_town: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    reg_type: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN).allow(null, ''),
    dateofbirth: Joi.date(),
    disability: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    area: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN)
});

export const studentSchemaAddstudent = Joi.object().keys({
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN).required().messages({
        'string.empty': speeches.USER_FULLNAME_REQUIRED
    }),
    type: Joi.string().trim().min(1).regex(constents.ONLY_DIGIT_PATTERN).required().messages({
        'string.empty': speeches.USER_TYPE_REQUIRED
    }),
    username: Joi.string().email(),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_type: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    roll_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    id_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN).allow(null, ''),
    branch: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    year_of_study: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    password: Joi.any(),
    confirmPassword: Joi.any(),
    gender: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    college_town: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    dateofbirth: Joi.date(),
    disability: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    area: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN)
});

export const studentUpdateSchema = Joi.object().keys({
    status: Joi.string().valid(...Object.values(constents.common_status_flags.list)),
    full_name: Joi.string().trim().min(1).regex(constents.ALPHA_NUMERIC_PATTERN),
    username: Joi.string().email(),
    mobile: Joi.string().trim().regex(constents.ONLY_DIGIT_PATTERN),
    district: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_type: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    college_name: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN),
    roll_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    id_number: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN).allow(null, ''),
    branch: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    year_of_study: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    password: Joi.any(),
    type: Joi.string().trim().min(1).regex(constents.ONLY_DIGIT_PATTERN),
    gender: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    college_town: Joi.string().regex(constents.ALPHA_NUMERIC_PLUS_PATTERN).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    dateofbirth: Joi.date(),
    disability: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN),
    area: Joi.string().regex(constents.ALPHA_NUMERIC_PATTERN)

});

export const studentLoginSchema = Joi.object().keys({
    username: Joi.string().required().messages({
        'string.empty': speeches.USER_USERNAME_REQUIRED
    }),
    password: Joi.string().messages({
        'string.empty': speeches.USER_PASSWORD_REQUIRED
    }),
    logintype: Joi.string()
});

export const studentChangePasswordSchema = Joi.object().keys({
    user_id: Joi.string().required().messages({
        'string.empty': speeches.USER_USERID_REQUIRED
    }),
    old_password: Joi.string().required().messages({
        'string.empty': speeches.USER_OLDPASSWORD_REQUIRED
    }),
    new_password: Joi.string().trim().min(1).required().messages({
        'string.empty': speeches.USER_NEWPASSWORD_REQUIRED
    })
});
