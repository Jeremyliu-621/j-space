import React from 'react';
import { useTheme } from '../ThemeProvider';

interface DesktopProps {
  children: React.ReactNode;
}

export default function Desktop({ children }: DesktopProps) {
  const theme = useTheme();
  const bgStyle = theme.getDesktopBackground();
  const beforeStyle = theme.getDesktopBeforeStyle();
  const overlayStyle = theme.getDesktopOverlayStyle();

  return (
    <div
      className="win98-desktop"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'visible',
        backgroundColor: '#c0c0c0',
        ...bgStyle,
      }}
    >
      {/* Filtered background pseudo-element replacement */}
      {beforeStyle.display !== 'none' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: beforeStyle.backgroundImage,
          backgroundRepeat: beforeStyle.backgroundRepeat as string,
          backgroundPosition: beforeStyle.backgroundPosition as string,
          backgroundSize: beforeStyle.backgroundSize as string,
          filter: beforeStyle.filter,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}

      {/* Theme overlay */}
      {overlayStyle.display !== 'none' && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: overlayStyle.backgroundColor,
          pointerEvents: 'none',
          zIndex: 1,
          mixBlendMode: 'multiply',
          opacity: 0.6,
        }} />
      )}

      {/* Desktop content area */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 28px)', overflow: 'visible', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
