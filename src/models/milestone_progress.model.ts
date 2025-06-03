import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';


export class milestone_progress extends Model<InferAttributes<milestone_progress>, InferCreationAttributes<milestone_progress>> {
    declare milestone_progress_id: CreationOptional<number>;
    declare milestone_id: number;
    declare challenge_response_id: number;
    declare file: string;
    declare note: string;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;
}


milestone_progress.init(
    {
        milestone_progress_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        milestone_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        challenge_response_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        file: {
            type: DataTypes.STRING
        },
        note: {
            type: DataTypes.STRING
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
        tableName: 'milestone_progress',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);