import { ActionCategory, Severity } from "generated/prisma/enums";

export interface ActionDefinition<C extends string = string> {
    code: C;
    name: string;
    category: ActionCategory;
    severity: Severity;
}

export function defineActions<
    T extends Record<string, ActionDefinition<any>>
>(actions: T): T {
    return actions;
}