import React, { useState, useRef, useCallback } from 'react';

interface DesktopIconProps {
  id: string;
  icon: string;
  label: string;
  onDoubleClick: () => void;
}

export default function DesktopIcon({ id, icon, label, onDoubleClick }: DesktopIconProps) {
  const [selected, setSelected] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setSelected(false);
      onDoubleClick();
    } else {
      clickTimer.current = setTimeout(() => {
        setSelected(prev => !prev);
        clickTimer.current = null;
      }, 250);
    }
  }, [onDoubleClick]);

  // Deselect when clicking outside (handled via event propagation in parent)
  const handleBlur = useCallback(() => {
    setSelected(false);
  }, []);

  return (
    <div
      id={id}
      className={`desktop-folder${selected ? ' selected' : ''}`}
      onClick={handleClick}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <img src={icon} alt={label} loading="lazy" decoding="async" />
      <span>{label}</span>
    </div>
  );
}
