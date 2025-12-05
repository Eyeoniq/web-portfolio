import { getGalleryStructure } from '@/app/lib/gallery';
import { InteractiveGallery } from '@/app/components/InteractiveGallery';

interface GalleryServerProps {
  isDarkMode: boolean;
}

export function GalleryServer({ isDarkMode }: GalleryServerProps) {
  const galleryData = getGalleryStructure();

  return <InteractiveGallery gallery={galleryData} isDarkMode={isDarkMode} />;
}
