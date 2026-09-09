import {
	type ConnectedPosition,
	Overlay,
	type OverlayRef,
} from "@angular/cdk/overlay";
import { ComponentPortal, TemplatePortal } from "@angular/cdk/portal";
import {
	Directive,
	ElementRef,
	Input,
	inject,
	type OnDestroy,
	type TemplateRef,
	ViewContainerRef,
} from "@angular/core";
import { createActor } from "xstate";
import { OverlayCoordinatorService } from "./coordinator.service";
import { createOverlayMachine } from "./overlay.machine";
import { OverlayPanelComponent } from "./overlay-panel.component";

const POSITIONS: ConnectedPosition[] = [
	{
		originX: "end",
		originY: "center",
		overlayX: "start",
		overlayY: "center",
	},
	{
		originX: "start",
		originY: "center",
		overlayX: "end",
		overlayY: "center",
	},
];

@Directive({
	selector: "[sharedOverlayPanel]",
	standalone: true,
	host: {
		"(mouseenter)": "onMouseEnter()",
		"(mouseleave)": "onMouseLeave()",
	},
})
export class OverlayPanelDirective implements OnDestroy {
	private overlay = inject(Overlay);
	private elementRef = inject(ElementRef);
	private viewContainerRef = inject(ViewContainerRef);
	private coordinator = inject(OverlayCoordinatorService);

	// 接收外部要塞入外殼內部的「內容模板」
	@Input("sharedOverlayPanel") contentTemplate!: TemplateRef<unknown>;

	private overlayRef: OverlayRef | null = null;

	// 初始化 XState Actor
	private overlayActor = createActor(
		createOverlayMachine({
			onOpen: () => this.open(),
			onClose: () => {
				this.close();
				console.log(`${Date.now()} - close`);
			},
		}),
	).start();

	onMouseEnter() {
		this.coordinator.registerAndOpen(this.overlayActor);
	}

	onMouseLeave() {
		this.overlayActor.send({ type: "MOUSE_LEAVE" });
	}

	private open() {
		if (this.overlayRef) return;
		const positionStrategy = this.overlay
			.position()
			.flexibleConnectedTo(this.elementRef)
			.withPositions(POSITIONS)
			.withPush(true);

		this.overlayRef = this.overlay.create({
			positionStrategy,
			hasBackdrop: false,
			scrollStrategy: this.overlay.scrollStrategies.reposition(),
		});

		// 監聽彈窗本身的滑鼠進入與離開事件
		const overlayElement = this.overlayRef.overlayElement;
		overlayElement.addEventListener("mouseenter", () => {
			this.coordinator.registerAndOpen(this.overlayActor);
		});
		overlayElement.addEventListener("mouseleave", () => {
			this.overlayActor.send({ type: "MOUSE_LEAVE" });
		});

		const contentPortal = new TemplatePortal(
			this.contentTemplate,
			this.viewContainerRef,
		);
		const panelPortal = new ComponentPortal(
			OverlayPanelComponent,
			this.viewContainerRef,
		);
		const panelRef = this.overlayRef.attach(panelPortal);

		panelRef.instance.contentPortal = contentPortal;
	}

	private close() {
		if (this.overlayRef) {
			this.overlayRef.dispose();
			this.overlayRef = null;
			this.coordinator.deregister(this.overlayActor);
		}
	}

	ngOnDestroy() {
		this.overlayActor.stop();
		this.close();
	}
}
