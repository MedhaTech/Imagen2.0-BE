import ValidationsHolder from "../validations/validationHolder";
import BaseController from "./base.controller";
import { milestone_progress, milestone_progressUpdateSchema } from "../validations/milestone_progress.validation";


export default class MilestoneProgressController extends BaseController {
    model = "milestone_progress";
    protected initializePath(): void {
        this.path = "/milestone_progress";
    };
    protected initializeValidations(): void {
        this.validations = new ValidationsHolder(milestone_progress, milestone_progressUpdateSchema);
    };
    protected initializeRoutes(): void {
        super.initializeRoutes();
    };
};