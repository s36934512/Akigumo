import type { Routes } from "@angular/router";

export const routes: Routes = [
	{ path: "", redirectTo: "explorer", pathMatch: "full" },
	{
		path: "explorer",
		loadComponent: () =>
			import("@/pages/explorer").then((m) => m.ExplorerPage),
	},
	{
		path: "detail/:id",
		loadComponent: () =>
			import("@/pages/archive-detail").then((m) => m.ArchiveDetailPage),
	},
	{
		path: "ontology",
		loadComponent: () =>
			import("@/pages/ontology").then((m) => m.OntologyPage),
	},
	{
		path: "uploads",
		loadComponent: () =>
			import("@/pages/uploads").then((m) => m.UploadsPage),
	},
	{
		// Legacy redirect: keep accessible during migration
		path: "main",
		redirectTo: "explorer",
		pathMatch: "full",
	},
	{
		path: "trash",
		redirectTo: "explorer",
		pathMatch: "full",
	},
	// Placeholder routes for nav items not yet implemented
	{ path: "unsorted", redirectTo: "explorer", pathMatch: "full" },
	{ path: "statistics", redirectTo: "explorer", pathMatch: "full" },
	{ path: "settings", redirectTo: "explorer", pathMatch: "full" },
	{
		path: "test",
		loadComponent: () => import("@/pages/test").then((m) => m.TPage),
	},
];
