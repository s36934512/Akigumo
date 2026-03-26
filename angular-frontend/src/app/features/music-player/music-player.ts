import { Component, computed, effect, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MusicStore } from './music.store';

@Component({
    selector: 'app-music-player',
    standalone: true,
    templateUrl: './music-player.html',
    styleUrls: ['./music-player.scss'],
    imports: [],
    providers: [MusicStore],
})
export class MusicPlayerComponent implements OnDestroy {
    private readonly platformId = inject(PLATFORM_ID);
    readonly store = inject(MusicStore);

    // Drives CSS animation classes on the host container
    readonly isPulsing = signal(false);
    readonly isShaking = signal(false);

    // Hydrated audio element; null on the server side
    private audio: HTMLAudioElement | null = null;

    // Skip the very first effect run so we don't pulse on initial load
    private firstRun = true;

    readonly currentTrack = computed(() => {
        const playlist = this.store.playlist();
        return playlist[this.store.currentIndex()] ?? null;
    });

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.audio = new Audio();
            this.audio.volume = this.store.volume();

            this.audio.ontimeupdate = () => {
                if (this.audio?.duration) {
                    this.store.setProgress((this.audio.currentTime / this.audio.duration) * 100);
                }
            };

            // Auto-advance to next track when the current one ends
            this.audio.onended = () => this.store.next();
        }

        // React to isPlaying changes: sync audio + trigger power-pulse animation
        effect(() => {
            const playing = this.store.isPlaying();

            if (!this.firstRun && isPlatformBrowser(this.platformId)) {
                this.triggerPulse();
            }
            this.firstRun = false;

            if (!isPlatformBrowser(this.platformId) || !this.audio) return;

            if (playing) {
                const track = this.currentTrack();
                if (track?.src) this.audio.src = track.src;
                this.audio.play().catch(() => { /* user gesture or missing src */ });
            } else {
                this.audio.pause();
            }
        });

        // Sync audio src when the track index changes
        effect(() => {
            const track = this.currentTrack();
            if (isPlatformBrowser(this.platformId) && this.audio && track?.src) {
                this.audio.src = track.src;
                if (this.store.isPlaying()) {
                    this.audio.play().catch(() => { });
                }
            }
        });
    }

    togglePlay(): void {
        if (this.store.isPlaying()) {
            this.store.pause();
        } else {
            this.store.play();
        }
    }

    /** Shake animation on the whole HUD – simulates mechanical button press */
    onAddClick(): void {
        this.isShaking.set(true);
        setTimeout(() => this.isShaking.set(false), 400);
    }

    private triggerPulse(): void {
        this.isPulsing.set(true);
        setTimeout(() => this.isPulsing.set(false), 600);
    }

    ngOnDestroy(): void {
        this.audio?.pause();
        this.audio = null;
    }
}
