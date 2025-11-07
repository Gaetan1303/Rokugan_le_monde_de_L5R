/**
 * [DEV SENIOR] Service Scenario - logique métier et accès aux scénarios.
 * - Centralise les opérations sur les scénarios, gestion des joueurs, accès et stats.
 * - Respecter la séparation des responsabilités et documenter toute évolution majeure.
 */
import { Scenario } from '../models/Scenario.js';
type ScenarioOptions = {
    clan?: string;
    saison?: string;
    title?: string;
    difficulty?: string;
};
export declare class ScenarioService {
    scenarios: Map<string, Scenario>;
    DATA_DIR: string;
    constructor();
    list(): any[];
    get(id: string): Scenario | null;
    create(payload: Partial<Scenario>): Scenario;
    remove(id: string): boolean;
    loadJson(filename: string): any;
    pick<T>(arr: T[]): T | null;
    generate(options?: ScenarioOptions): Scenario;
}
declare const scenarioService: ScenarioService;
export default scenarioService;
//# sourceMappingURL=scenarioService.d.ts.map