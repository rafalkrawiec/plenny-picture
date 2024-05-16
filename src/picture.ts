import type { PropType, Plugin } from 'vue';
import { defineComponent, h } from 'vue';

export type Photoable = {
  photos: Photo[];
}

export type Photo = {
  filename: string;
  mime: string;
  type: string;
  alt: string | null;
}

export const MediaPicture = defineComponent({
  inheritAttrs: false,
  name: 'MediaPicture',
  props: {
    model: { type: Object as PropType<Photoable>, required: false },
    photo: { type: [Object, Array, String] as PropType<Photo | Photo[] | string>, required: false },
    type: { type: String, required: false },
    sizes: { type: String, required: false },
    alt: { type: String, required: false, default: '' },
    loading: { type: String, required: false, default: 'lazy' },
    fallback: { type: String, required: false, default: 'fallback.jpg' },
    multi: { type: Boolean, required: false, default: false },
  },
  computed: {
    media() {
      if (this.photo instanceof Array) {
        if (this.type) {
          return this.photo.filter((p) => p.type === this.type);
        } else {
          return this.photo;
        }
      }

      if (typeof this.photo === 'string') {
        return createPhotosFromFilename(this.photo);
      }

      if (this.model) {
        if (this.type) {
          return extractFromPhotoable(this.model, this.type, this.multi);
        }

        throw new Error('You must provide photo type when extracting photos from model!');
      }

      if (this.photo) {
        return [this.photo];
      }

      return [
        createPhotosFromFilename(this.fallback),
      ];
    },
  },
  render() {
    return this.media.map((photo) => {
      let map = parseSize(this.sizes).map(({ size, density, min, max }) => [
        h('source', {
          srcSet: photoUrl(photo.filename || this.fallback, size, density, true),
          media: mediaQuery(min, max),
          type: 'image/webp',
        }),
        h('source', {
          srcSet: photoUrl(photo.filename || this.fallback, size, density, false),
          media: mediaQuery(min, max),
          type: photo.mime,
        }),
      ]);

      let image = [
        h('source', {
          srcSet: photoUrl(photo.filename || this.fallback, undefined, undefined, true),
          type: 'image/webp',
        }),
        h('img', {
          src: photoUrl(photo.filename || this.fallback, undefined, undefined),
          alt: photo.alt || this.alt,
          loading: this.loading,
        }),
      ];

      return h('picture', this.$attrs, [...map, ...image]);
    });
  },
});

export function photoUrl(filename: string, size?: string, density?: number, webp: boolean = false) {
  let path = `/photos`;

  if (size) {
    path = `${path}/${size}`;
  }

  if (webp) {
    filename = filename.substring(0, filename.lastIndexOf('.')) + '.webp';
  }

  path = `${path}/${filename}`;

  if (density) {
    path = `${path} ${density}x`;
  }

  return path;
}


export function mediaQuery(min, max): string | undefined {
  if (!min && !max) {
    return undefined;
  } else if (min && max) {
    return `(min-width: ${min}px) and (max-width: ${max}px)`;
  } else if (min) {
    return `(min-width: ${min}px)`;
  }

  return `(max-width: ${max}px)`;
}

export function parseSize(raw?: string) {
  if (!raw) {
    return [];
  }

  return raw.split(',').map((entry) => {
    entry = entry.trim();

    let size: any = entry.match(/\d+x\d+/);
    let density: any = entry.match(/\s(\d+)x/);
    let min: any = entry.match(/min (\d+)/);
    let max: any = entry.match(/max (\d+)/);

    if (density) density = Number(density[1]);
    if (min) min = Number(min[1]);
    if (max) max = Number(max[1]);

    return { size, density, min, max };
  });
}

export function extractFromPhotoable(model: Photoable, type: string, multi?: boolean): Photo[] {
  if (multi) {
    return model.photos.filter((photo: Photo) => photo.type === type);
  }

  let photo = model.photos.find((photo: Photo) => photo.type === type);

  if (photo) {
    return [photo];
  }

  return [];
}

export function createPhotosFromFilename(filename: string) {
  let ext = filename.substring(filename.lastIndexOf('.'));
  let mime = 'image/jpeg';
  let alt = '';

  switch (ext) {
    case 'png':
      mime = 'image/png';
      break;

    case 'gif':
      mime = 'image/gif';
      break;

    case 'webp':
      mime = 'image/webp';
      break;
  }

  return [{ filename, mime, alt }];
}

export const PicturePlugin: Plugin = {
  install(app) {
    app.component('MediaPicture', MediaPicture);
  },
};

export * from './extensions';
