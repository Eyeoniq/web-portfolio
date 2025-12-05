export interface GalleryItem {
  name: string;
  path: string;
  items: GallerySubItem[];
}

export interface GallerySubItem {
  name: string;
  type: 'folder' | 'image' | 'video' | 'gif';
  path: string;
  images?: string[];
}
