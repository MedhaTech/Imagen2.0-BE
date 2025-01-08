import { DataTypes, Model } from 'sequelize';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';

export interface discussionForum {
    discussion_forum_id: number;
    query_category: string;
    query_details: string;
    file: string;
    link: string;
    status: Enumerator;
    district: string;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
}

export class discussion_forum extends Model<discussionForum> { }

discussion_forum.init(
    {
        discussion_forum_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        query_category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        query_details: {
            type: DataTypes.TEXT("long"),
            allowNull: false
        },
        file: {
            type: DataTypes.TEXT("long")
        },
        link: {
            type: DataTypes.TEXT("long")
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.discussion_forum_status_flags.list)),
            defaultValue: constents.discussion_forum_status_flags.default
        },
        district: {
            type: DataTypes.STRING,
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
        tableName: 'discussion_forums',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);