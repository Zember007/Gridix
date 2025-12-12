import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export const useBuildingImage = (imageUrl?: string | null) => {
  const [buildingImageLoaded, setBuildingImageLoaded] = useState(false);
  const [buildingImageNaturalSize, setBuildingImageNaturalSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const imageLoadRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imageLoadRef.current) {
      imageLoadRef.current.onload = null;
      imageLoadRef.current.onerror = null;
      imageLoadRef.current.src = '';
    }

    setBuildingImageLoaded(false);
    setBuildingImageNaturalSize({ width: 0, height: 0 });

    if (!imageUrl) {
      setBuildingImageLoaded(true);
      return;
    }

    const img = new Image();
    imageLoadRef.current = img;

    img.onload = () => {
      if (img === imageLoadRef.current) {
        setBuildingImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setBuildingImageLoaded(true);
      }
    };

    img.onerror = () => {
      if (img === imageLoadRef.current) {
        setBuildingImageLoaded(true);
      }
    };

    img.src = imageUrl;

    return () => {
      if (imageLoadRef.current === img) {
        imageLoadRef.current.onload = null;
        imageLoadRef.current.onerror = null;
        imageLoadRef.current = null;
      }
    };
  }, [imageUrl]);

  return {
    buildingImageLoaded,
    buildingImageNaturalSize,
  };
};

























