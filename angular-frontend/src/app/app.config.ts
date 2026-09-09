import { provideHttpClient } from "@angular/common/http";
import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from "@angular/core";
import {
	provideClientHydration,
	withEventReplay,
	withNoIncrementalHydration,
} from "@angular/platform-browser";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideDynamicForm } from "@ng-forge/dynamic-forms";
import { withMaterialFields } from "@ng-forge/dynamic-forms-material";
import { provideFormlyCore } from "@ngx-formly/core";
import { withFormlyMaterial } from "@ngx-formly/material";
import { provideOptimus } from "@openng/optimus-ui/config";
import {
	provideTanStackQuery,
	QueryClient,
} from "@tanstack/angular-query-experimental";
import { MyCustomPreset } from "@/shared/themes/theme";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
	providers: [
		provideHttpClient(),
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes, withComponentInputBinding()),
		provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
		provideTanStackQuery(new QueryClient()),
		provideOptimus({
			theme: {
				// preset: Aura
				preset: MyCustomPreset,
			},
		}),
		provideFormlyCore(withFormlyMaterial()),

		provideDynamicForm(
			...withMaterialFields(),
			// Opt into legacy .ng-touched / .ng-invalid CSS classes. Add if your
			// theme or custom CSS targets those classes; safe to omit otherwise.
		),
	],
};
