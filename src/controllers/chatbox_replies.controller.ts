import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { chatbox_replies, chatbox_repliesUpdateSchema } from "../validations/chatbox_replies.validation";


export default class Chatbox_repliesController extends BaseController {
    model = "chatbox_replies";
    protected initializePath(): void {
        this.path = "/chatbox_replies";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(chatbox_replies, chatbox_repliesUpdateSchema);
    };
    protected initializeRoutes(): void {
        super.initializeRoutes();
    };
};