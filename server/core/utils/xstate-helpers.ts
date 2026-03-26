export function waitForState(actor: any, targetState: string, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            sub.unsubscribe();
            reject(new Error(`Timeout waiting for state: ${targetState}`));
        }, timeout);

        const sub = actor.subscribe((state: any) => {
            if (state.matches(targetState)) {
                clearTimeout(timer);
                sub.unsubscribe();
                resolve(state);
            }
            // 如果走到 failure 狀態也要提早結束
            if (state.matches('failure')) {
                clearTimeout(timer);
                sub.unsubscribe();
                reject(new Error('Machine entered failure state'));
            }
        });
    });
}