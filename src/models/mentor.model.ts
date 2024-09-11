import { DataTypes, Model, Attributes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import bcrypt from 'bcrypt';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';
import { baseConfig } from '../configs/base.config';
import { user } from './user.model';
import { organization } from './organization.model';
import { student } from './student.model';


export class mentor extends Model<InferAttributes<mentor>, InferCreationAttributes<mentor>> {
    declare mentor_id: CreationOptional<number>;
    declare user_id: number;
    declare full_name: string;
    declare mobile: string;
    declare district: string;
    declare college_type: string;
    declare college_name: string;
    declare otp:number;
    declare status: Enumerator;
    declare badges: string;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;
    
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
}

mentor.init(
    {
        mentor_id: {
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
            type: DataTypes.STRING,
            unique: true
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
        otp: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.common_status_flags.list)),
            defaultValue: constents.common_status_flags.default
        },
        badges: {
            type: DataTypes.TEXT('long')
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
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
    },
    {
        sequelize: db,
        tableName: 'mentors',
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

mentor.belongsTo(user, { foreignKey: 'user_id', constraints: false, scope: { role: 'MENTOR' } });
user.hasOne(mentor, { foreignKey: 'user_id', constraints: false });
// mentor.belongsTo(organization, { targetKey: 'organization_code', foreignKey: 'organization_code', constraints: false });
// organization.hasOne(mentor, { sourceKey: 'organization_code', foreignKey: 'organization_code', constraints: false });
// mentor.belongsTo(student, { targetKey: 'team_id', foreignKey: 'organization_code', constraints: false });
// student.hasOne(mentor, { sourceKey: 'team_id', foreignKey: 'organization_code', constraints: false });