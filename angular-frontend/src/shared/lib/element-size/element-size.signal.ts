import { isPlatformBrowser } from "@angular/common";
import {
	type ElementRef,
	effect,
	Injector,
	inject,
	PLATFORM_ID,
	type Signal,
	signal,
} from "@angular/core";

export function useElementSize(
	elementSignal: Signal<ElementRef<HTMLElement> | undefined>,
	options?: { injector?: Injector },
) {
	// 為了防止在非注入上下文呼叫，保留 Injector 彈性，這在任何版本都適用
	const injector = options?.injector ?? inject(Injector);

	const platformId = inject(PLATFORM_ID);
	const isBrowser = isPlatformBrowser(platformId);

	const size = signal<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	effect(
		(onCleanup) => {
			if (!isBrowser) return;

			const el = elementSignal()?.nativeElement;
			if (!el) return;

			const observer = new ResizeObserver(([entry]) => {
				if (entry) {
					size.set({
						width:
							entry.borderBoxSize[0]?.inlineSize ??
							el.offsetWidth,
						height:
							entry.borderBoxSize[0]?.blockSize ??
							el.offsetHeight,
					});
				}
			});

			observer.observe(el);
			onCleanup(() => observer.disconnect());
		},
		{ injector },
	);

	return size.asReadonly();
}
