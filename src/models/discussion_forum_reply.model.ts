import { DataTypes, Model } from 'sequelize';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';
import { user } from './user.model';
import { discussion_forum } from './discussion_forum.model';

export interface discussionForumRepliesAttributes {
    discussion_forum_reply_id: number;
    discussion_forum_id: string;
    reply_details: string;
    file: string;
    link: string;
    status: Enumerator;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
}

export class discussion_forum_reply extends Model<discussionForumRepliesAttributes> { }

discussion_forum_reply.init(
    {
        discussion_forum_reply_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        discussion_forum_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reply_details: {
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
        tableName: 'discussion_forum_replies',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at',
    }
);

discussion_forum_reply.belongsTo(discussion_forum, { foreignKey: 'discussion_forum_id' });
discussion_forum_reply.belongsTo(user, { foreignKey: 'created_by' })
discussion_forum_reply.belongsTo(user, { foreignKey: 'updated_by' })
discussion_forum.hasMany(discussion_forum_reply, { foreignKey: 'discussion_forum_id' });