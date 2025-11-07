import type { Request, Response } from 'express';
export declare function loadJsonFile<T>(filename: string): Promise<T>;
declare class ReferenceController {
    static getSkills(req: Request, res: Response): Promise<void>;
    static getDisadvantageById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getClanById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getSchoolById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default ReferenceController;
//# sourceMappingURL=ReferenceController.d.ts.map