export class Timer {
    private timerId: any = null;

    start(callback: () => void, delay: number) {
        this.clear();
        this.timerId = setTimeout(callback, delay);
    }

    clear() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    isActive(): boolean {
        return this.timerId !== null;
    }
}
