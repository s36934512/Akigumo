import { PortalModule } from "@angular/cdk/portal";

export interface ImageDTO {
  file_name: string;
  width: number;
  height: number;
}

export interface BaseImageViewModel {
  id: number;
  url: string;
  selected: boolean;
}

export interface ImageWithSizeViewModel extends BaseImageViewModel {
  width: number;
  height: number;
}
