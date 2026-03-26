import { Injectable, OnDestroy, signal } from '@angular/core';
import { createActor } from 'xstate';

import {
    IdResolverMachine,
    ResolvedItemDisplay,
    ResolverPriority,
} from '../machines/id-resolver.machine';

@Injectable({ providedIn: 'root' })
export class ItemFileResolverService implements OnDestroy {
    private readonly actor = createActor(IdResolverMachine);
    private readonly resolvedMapSignal = signal<Map<string, ResolvedItemDisplay>>(new Map());

    constructor() {
        this.actor.subscribe((snapshot) => {
            const nextResolved = snapshot.context.resolvedMap;
            this.resolvedMapSignal.set(new Map(nextResolved));
        });

        this.actor.start();
    }

    prefetch(itemIds: string[]): void {
        this.enqueue(itemIds, 'low');
    }

    requestResolve(itemId: string): void {
        this.enqueue([itemId], 'high');
    }

    getCoverUrl(itemId: string): string | undefined {
        const resolved = this.resolvedMapSignal().get(itemId);
        if (!resolved) return undefined;

        if (resolved.coverUrl) {
            return resolved.coverUrl;
        }

        if (!resolved.fileId) {
            return undefined;
        }

        return `/api/v1/files/${resolved.fileId}/serve`;
    }

    ngOnDestroy(): void {
        this.actor.stop();
    }

    private enqueue(itemIds: string[], priority: ResolverPriority): void {
        const cleaned = Array.from(new Set(itemIds.filter(Boolean)));
        if (cleaned.length === 0) return;

        this.actor.send({ type: 'ENQUEUE', itemIds: cleaned, priority });
        this.actor.send({ type: 'RESOLVE' });
    }
}
