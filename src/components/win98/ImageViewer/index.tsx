import { useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '../../../lib/images';
import { useTheme } from '../ThemeProvider';
import Media from '../../Media';

interface ImageViewerProps {
  imageList: string[];
  initialIndex: number;
}

export default function ImageViewer({ imageList, initialIndex }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const theme = useTheme();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, imageList.length - 1));
  }, [imageList.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const currentName = imageList[currentIndex];
  const currentUrl = getImageUrl(currentName.split('.')[0]);
  const borderColor = theme.paletteKey === 'default' ? '#808080' : theme.palette.colors[1];

  return (
    <div style={{ padding: 8, height: 'calc(100% - 54px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative', overflow: 'hidden', padding: 8 }}>
        <div className="viewer-image-inner" style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', boxSizing: 'border-box', borderColor }}>
          <Media src={currentUrl || ''} alt={currentName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <button className="project-tab" onClick={goPrev} disabled={currentIndex === 0}>
          <img loading="lazy" decoding="async" src={getImageUrl('back-icon') || ''} alt="Previous" style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} /> Previous
        </button>
        <span style={{ fontWeight: 'bold', flex: 1, textAlign: 'center', margin: '0 8px' }}>{currentName}</span>
        <span style={{ color: '#666', margin: '0 8px' }}>{currentIndex + 1} / {imageList.length}</span>
        <button className="project-tab" onClick={goNext} disabled={currentIndex === imageList.length - 1}>
          Next <img loading="lazy" decoding="async" src={getImageUrl('forward-icon') || ''} alt="Next" style={{ width: 16, height: 16, marginLeft: 4, verticalAlign: 'middle' }} />
        </button>
      </div>
    </div>
  );
}
