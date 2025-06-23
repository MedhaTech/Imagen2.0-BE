import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import bcrypt from 'bcrypt';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';
import { baseConfig } from '../configs/base.config';
import { user } from './user.model';

export class student extends Model<InferAttributes<student>, InferCreationAttributes<student>> {
    declare student_id: CreationOptional<number>;
    declare user_id: number;
    declare full_name: string;
    declare mobile: number;
    declare email: string;
    declare district: string;
    declare college_type: string;
    declare college_name: string;
    declare roll_number: string;
    declare id_number: string;
    declare branch: string;
    declare year_of_study: string;
    declare type: number;
    declare badges: string;
    declare certificate: number;
    declare college_town: string;
    declare gender: string;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;
    declare otp: number;
    declare course: number;
    declare reg_type: string;
    declare dateofbirth: Date;
    declare disability: string;
    declare area: string;
}

student.init(
    {
        student_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mobile: {
            type: DataTypes.INTEGER
        },
        email: {
            type: DataTypes.STRING
        },
        district: {
            type: DataTypes.STRING
        },
        college_type: {
            type: DataTypes.STRING
        },
        college_name: {
            type: DataTypes.STRING
        },
        roll_number: {
            type: DataTypes.STRING
        },
        id_number: {
            type: DataTypes.STRING
        },
        branch: {
            type: DataTypes.STRING
        },
        year_of_study: {
            type: DataTypes.STRING
        },
        college_town: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.INTEGER
        },
        badges: {
            type: DataTypes.TEXT('long')
        },
        certificate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.common_status_flags.list)),
            defaultValue: constents.common_status_flags.default
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            onUpdate: new Date().toLocaleString()
        },
        otp: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        course: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reg_type: {
            type: DataTypes.STRING
        },
        dateofbirth: {
            type: DataTypes.DATE
        },
        disability: {
            type: DataTypes.STRING
        },
        area: {
            type: DataTypes.STRING
        }
    },
    {
        sequelize: db,
        tableName: 'students',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
        hooks: {
            beforeCreate: async (user: any) => {
                if (user.password) {
                    user.password = await bcrypt.hashSync(user.password, process.env.SALT || baseConfig.SALT);
                }
            },
            beforeUpdate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hashSync(user.password, process.env.SALT || baseConfig.SALT);
                }
            }
        }
    }
);

student.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(student, { foreignKey: 'user_id' });
student.belongsTo(user, { foreignKey: 'user_id' });
user.hasMany(student, { foreignKey: 'user_id' });