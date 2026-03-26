import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export interface Track {
    title: string;
    src: string;
}

interface MusicState {
    playlist: Track[];
    currentIndex: number;
    isPlaying: boolean;
    volume: number;
    // Progress as a percentage 0–100
    progress: number;
}

const initialState: MusicState = {
    playlist: [
        { title: 'SYNTHETIC HORIZON', src: '' },
        { title: 'INTERSTELLAR VOYAGE', src: '' },
        { title: 'NEON PULSE', src: '' },
    ],
    currentIndex: 0,
    isPlaying: false,
    volume: 0.8,
    progress: 0,
};

export const MusicStore = signalStore(
    withState(initialState),
    withMethods((store) => ({
        play(): void {
            patchState(store, { isPlaying: true });
        },
        pause(): void {
            patchState(store, { isPlaying: false });
        },
        next(): void {
            const next = (store.currentIndex() + 1) % store.playlist().length;
            patchState(store, { currentIndex: next, progress: 0 });
        },
        prev(): void {
            const len = store.playlist().length;
            const prev = (store.currentIndex() - 1 + len) % len;
            patchState(store, { currentIndex: prev, progress: 0 });
        },
        addTrack(track: Track): void {
            patchState(store, { playlist: [...store.playlist(), track] });
        },
        setProgress(progress: number): void {
            patchState(store, { progress });
        },
    })),
);
