import { MediaPicture } from './picture';

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    MediaPicture: typeof MediaPicture,
  }
}
