import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { constents } from '../configs/constents.config';
import db from '../utils/dbconnection.util';

export class challenge_response extends Model<InferAttributes<challenge_response>, InferCreationAttributes<challenge_response>> {
    declare challenge_response_id: CreationOptional<number>;
    declare challenge_id: ForeignKey<number>;
    declare student_id: ForeignKey<number>;
    declare others: String;
    declare initiated_by: String;
    declare submitted_at: String;
    declare evaluated_by: String;
    declare evaluated_at: Date;
    declare status: Enumerator;
    declare evaluation_status: Enumerator;
    declare rejected_reason: String;
    declare rejected_reasonSecond: String;
    declare final_result: Enumerator;
    declare district: String;
    declare state: String
    declare created_by: number;
    declare created_at: Date;
    declare updated_by: number;
    declare updated_at: Date;
    declare theme: String;
    declare idea_describe: String;
    declare title: String;
    declare solve: String;
    declare customer: String;
    declare detail: String;
    declare stage: String;
    declare unique: String;
    declare similar: String;
    declare revenue: String;
    declare society: String;
    declare confident: String;
    declare prototype_image: String;
    declare prototype_link: String;
    declare support: String;
    declare verified_status: Enumerator;
    declare verified_at: Date;
    declare mentor_rejected_reason: String;
    declare mentorship_user_id: number;

}

challenge_response.init(
    {
        challenge_response_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        final_result: {
            type: DataTypes.ENUM(...Object.values(constents.final_result_flags.list)),
            defaultValue: constents.final_result_flags.default,
            allowNull: true,
        },
        district: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        challenge_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        others: {
            type: DataTypes.STRING,
            allowNull: true
        },
        theme: {
            type: DataTypes.STRING,
            allowNull: true
        },
        idea_describe: {
            type: DataTypes.STRING,
            allowNull: true
        },
        title: {
            type: DataTypes.STRING
        },
        solve: {
            type: DataTypes.STRING
        },
        customer: {
            type: DataTypes.STRING
        },
        detail: {
            type: DataTypes.STRING
        },
        stage: {
            type: DataTypes.STRING
        },
        unique: {
            type: DataTypes.STRING
        },
        similar: {
            type: DataTypes.STRING
        },
        revenue: {
            type: DataTypes.STRING
        },
        society: {
            type: DataTypes.STRING
        },
        confident: {
            type: DataTypes.STRING
        },
        prototype_image: {
            type: DataTypes.STRING
        },
        prototype_link: {
            type: DataTypes.STRING
        },
        support: {
            type: DataTypes.STRING
        },
        verified_status: {
            type: DataTypes.ENUM(...Object.values(constents.verified_status_flags.list)),
            defaultValue: constents.verified_status_flags.default
        },
        verified_at: {
            type: DataTypes.STRING
        },
        mentor_rejected_reason: {
            type: DataTypes.STRING
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        initiated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        submitted_at: {
            type: DataTypes.DATE(),
            allowNull: true
        },
        evaluated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        evaluated_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        evaluation_status: {
            type: DataTypes.ENUM(...Object.values(constents.evaluation_status.list)),
            allowNull: true
        },
        rejected_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rejected_reasonSecond: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(...Object.values(constents.challenges_flags.list)),
            allowNull: false,
            defaultValue: constents.challenges_flags.default
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
        mentorship_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    },
    {
        sequelize: db,
        tableName: 'challenge_responses',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);