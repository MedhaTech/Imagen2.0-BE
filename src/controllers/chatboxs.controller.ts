import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { chatboxs, chatboxsUpdateSchema } from "../validations/chatboxs.validation";


export default class ChatboxsController extends BaseController {
    model = "chatboxs";
    protected initializePath(): void {
        this.path = "/chatboxs";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(chatboxs, chatboxsUpdateSchema);
    };
    protected initializeRoutes(): void {
        super.initializeRoutes();
    };
};