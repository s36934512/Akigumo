import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "@openng/optimus-ui/button";
import { MusicPlayerComponent } from "@/features/_music-player/music-player";
import { UppyStoreService } from "@/features/upload-center/api/uppy-store.service";
import { THEME } from "@/shared/themes/theme";
import { LogoComponent } from "./logo/logo.component";
import { NavigationComponent } from "./navigation/navigation.component";

@Component({
	selector: "widget-header",
	templateUrl: "./header.html",
	standalone: true,
	imports: [
		ButtonModule,
		MusicPlayerComponent,
		LogoComponent,
		NavigationComponent,
	],
})
export class HeaderComponent {
	readonly theme = THEME;

	private router = inject(Router);
	private uppyStore = inject(UppyStoreService);

	get uploadCount() {
		return this.uppyStore.activeUploads().length;
	}

	gotoUploads() {
		this.router.navigateByUrl("/uploads");
	}
}
