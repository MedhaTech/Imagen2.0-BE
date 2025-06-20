import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import db from '../utils/dbconnection.util';
import { constents } from '../configs/constents.config';


export class schedule_call extends Model<InferAttributes<schedule_call>, InferCreationAttributes<schedule_call>> {

    declare schedule_call_id: CreationOptional<number>;
    declare meet_link: string;
    declare timing: Date;
    declare mom: string;
    declare challenge_response_id: number;
    declare stu_accept: Enumerator;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;

}

schedule_call.init(
    {
        schedule_call_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        meet_link: {
            type: DataTypes.STRING
        },
        timing: {
            type: DataTypes.DATE,
            allowNull: true
        },
        challenge_response_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mom: {
            type: DataTypes.STRING
        },
        stu_accept: {
            type: DataTypes.ENUM(...Object.values(constents.final_result_flags.list))
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.task_status_flags.list)),
            defaultValue: constents.task_status_flags.default
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
        }
    },
    {
        sequelize: db,
        tableName: 'schedule_calls',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);