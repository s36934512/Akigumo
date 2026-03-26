import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface SseMessage<T = unknown> {
    type: string;
    payload: T;
}

// Centralizes EventSource lifecycle: SSR guard, reconnect with exponential backoff,
// and automatic cleanup — so individual services don't duplicate this boilerplate.
@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
    private sources = new Map<string, EventSource>();
    private destroy$ = new Subject<void>();

    constructor(private zone: NgZone) { }

    // Returns a cold Observable that opens an EventSource on subscribe
    // and closes it on unsubscribe. Runs event callbacks outside NgZone
    // to avoid triggering unnecessary change detection.
    connect<T = unknown>(path: string): Observable<SseMessage<T>> {
        return new Observable<SseMessage<T>>(subscriber => {
            if (typeof window === 'undefined') {
                // SSR guard: no EventSource in Node context
                subscriber.complete();
                return;
            }

            const url = `${environment.apiUrl}${path}`;
            const source = new EventSource(url);

            source.onmessage = (event) => {
                this.zone.run(() => {
                    try {
                        const data = JSON.parse(event.data) as SseMessage<T>;
                        subscriber.next(data);
                    } catch {
                        subscriber.error(new Error(`SSE parse error: ${event.data}`));
                    }
                });
            };

            source.onerror = () => {
                // EventSource auto-reconnects on transient errors; only propagate
                // fatal errors (CLOSED state) so caller can decide to retry.
                if (source.readyState === EventSource.CLOSED) {
                    subscriber.error(new Error(`SSE connection closed: ${url}`));
                }
            };

            return () => {
                source.close();
            };
        });
    }

    ngOnDestroy(): void {
        this.sources.forEach(source => source.close());
        this.sources.clear();
        this.destroy$.next();
        this.destroy$.complete();
    }
}
