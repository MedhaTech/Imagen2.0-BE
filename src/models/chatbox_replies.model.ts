import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';


export class chatbox_replie extends Model<InferAttributes<chatbox_replie>, InferCreationAttributes<chatbox_replie>> {
    declare chatbox_replie_id: CreationOptional<number>;
    declare chatbox_id: number;
    declare reply_details: string;
    declare status: Enumerator;
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;
}


chatbox_replie.init(
    {
        chatbox_replie_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        chatbox_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reply_details: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.common_status_flags.list)),
            defaultValue: constents.common_status_flags.default
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
        tableName: 'chatbox_replies',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);