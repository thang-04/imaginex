import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

const HISTORY_KEY = 'imaginex-image-history';
const MAX_IMAGES = 24;

export function useImageHistory() {
  const [images, setImagesState] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    get<string[]>(HISTORY_KEY)
      .then((val) => {
        if (val && Array.isArray(val)) {
          setImagesState(val);
        }
      })
      .catch((err) => {
        console.error('Failed to load image history', err);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setImages = (newImages: string[] | ((prev: string[]) => string[])) => {
    setImagesState((prev) => {
      let updated = typeof newImages === 'function' ? newImages(prev) : newImages;
      updated = updated.slice(0, MAX_IMAGES);
      
      set(HISTORY_KEY, updated).catch((err) => {
        console.error('Failed to save image history', err);
      });
      
      return updated;
    });
  };

  const clearHistory = () => {
    setImages([]);
  };

  return { 
    generatedImages: images, 
    setGeneratedImages: setImages, 
    clearHistory, 
    isHistoryLoaded: isLoaded 
  };
}
