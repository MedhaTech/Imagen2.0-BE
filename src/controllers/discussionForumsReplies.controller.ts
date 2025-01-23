import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { discussionForumsReplies, discussionForumsRepliesUpdateSchema } from "../validations/discussionForumReplies.validation";


export default class DiscussionForumRepliesController extends BaseController {
    model = "discussion_forum_reply";
    protected initializePath(): void {
        this.path = "/discussionForumsReply";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(discussionForumsReplies, discussionForumsRepliesUpdateSchema);
    };
    protected initializeRoutes(): void {
        super.initializeRoutes();
    };
};