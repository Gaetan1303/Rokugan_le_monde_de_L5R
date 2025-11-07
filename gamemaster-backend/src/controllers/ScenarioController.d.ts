import type { Request, Response } from 'express';
declare class ScenarioController {
    static list(req: Request, res: Response): void;
    static get(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static create(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static generate(req: Request, res: Response): void;
    static remove(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
}
export default ScenarioController;
//# sourceMappingURL=ScenarioController.d.ts.map