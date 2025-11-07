export interface Skill {
    id: string;
    name: string;
    description?: string;
    [key: string]: unknown;
}
export interface Trait {
    id: string;
    name: string;
    description?: string;
    [key: string]: unknown;
}
export interface Advantage {
    id: string;
    name: string;
    description?: string;
    [key: string]: unknown;
}
export interface ReferenceData {
    competences: Skill[];
    traits: Trait[];
    advantages: Advantage[];
    disadvantages?: Disadvantage[];
    clans?: Clan[];
    ecoles?: School[];
}
export interface Disadvantage {
    id: string;
    name: string;
    description?: string;
    [key: string]: unknown;
}
export interface Clan {
    id: string;
    name: string;
    familles?: string[];
    [key: string]: unknown;
}
export interface School {
    id: string;
    name: string;
    clan?: string;
    [key: string]: unknown;
}
//# sourceMappingURL=referenceTypes.d.ts.map