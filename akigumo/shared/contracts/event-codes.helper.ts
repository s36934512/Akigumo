export const EVENT_CODE_SUCCESS = 'SUCCESS';
export const EVENT_CODE_FAILURE = 'FAILURE';


export function createEventCodes<
    T extends Record<string, { readonly code: string }>
>(actions: T) {
    const result = {} as any;

    for (const key in actions) {
        const code = actions[key].code;
        const successKey = `${code}_SUCCESS` as const;
        const failureKey = `${code}_FAILURE` as const;

        result[successKey] = successKey;
        result[failureKey] = failureKey;
    }

    return result as {
        [K in keyof T as `${T[K]['code']}_SUCCESS`]: `${T[K]['code']}_SUCCESS`;
    } & {
        [K in keyof T as `${T[K]['code']}_FAILURE`]: `${T[K]['code']}_FAILURE`;
    };
}