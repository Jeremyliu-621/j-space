import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getImageUrl } from '../../lib/images';

export interface ColorPalette {
  name: string;
  colors: [string, string, string, string]; // darkest to lightest
}

export const colorPalettes: Record<string, ColorPalette> = {
  default: { name: "Default", colors: ["#000000", "#808080", "#c0c0c0", "#e0e0e0"] },
  dark: { name: "Dark", colors: ["#1a1a1a", "#2d2d2d", "#404040", "#525252"] },
  retroGreen: { name: "Retro Green", colors: ["#5C6F2B", "#DE802B", "#D8C9A7", "#EEEEEE"] },
  Lilac: { name: "Lilac", colors: ["#898AC4", "#A2AADB", "#C0C9EE", "#FFF2E0"] },
  Snow: { name: "Snow", colors: ["#89A8B2", "#B3C8CF", "#E5E1DA", "#F1F0E8"] },
  Chocolate: { name: "Dark Chocolate", colors: ["#896C6C", "#E5BEB5", "#EEE6CA", "#e0e0e0"] },
  Cream: { name: "Cream", colors: ["#C9B59C", "#D9CFC7", "#EFE9E3", "#F9F8F6"] },
  calmGreen: { name: "Calm Green", colors: ["#778873", "#A1BC98", "#D2DCB6", "#F1F3E0"] },
};

const THEME_FILTERS: Record<string, string> = {
  retroGreen: "hue-rotate(15deg) saturate(1.1) brightness(0.95)",
  Lilac: "hue-rotate(20deg) saturate(1.15) brightness(1.02)",
  Snow: "hue-rotate(180deg) saturate(0.9) brightness(1.05)",
  Chocolate: "hue-rotate(25deg) saturate(1.2) brightness(0.92)",
  Cream: "hue-rotate(30deg) saturate(1.1) brightness(1.03)",
  calmGreen: "hue-rotate(4deg) saturate(1.15) brightness(0.98)",
};

const THEME_OVERLAYS: Record<string, string> = {
  retroGreen: "rgba(92, 111, 43, 0.08)",
  Lilac: "rgba(137, 138, 196, 0.06)",
  Snow: "rgba(137, 168, 178, 0.05)",
  Chocolate: "rgba(137, 108, 108, 0.07)",
  Cream: "rgba(201, 181, 156, 0.06)",
  calmGreen: "rgba(119, 136, 115, 0.07)",
};

interface ThemeContextType {
  paletteKey: string;
  palette: ColorPalette;
  applyPalette: (key: string) => void;
  getDesktopBackground: () => React.CSSProperties;
  getDesktopBeforeStyle: () => React.CSSProperties;
  getDesktopOverlayStyle: () => React.CSSProperties;
  getWindowBodyStyle: () => React.CSSProperties;
  getButtonStyle: () => React.CSSProperties;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [paletteKey, setPaletteKey] = useState<string>(() => {
    // Pick random theme on load (excluding default and dark)
    const keys = Object.keys(colorPalettes).filter(k => k !== 'default' && k !== 'dark');
    return keys[Math.floor(Math.random() * keys.length)];
  });

  const palette = colorPalettes[paletteKey] || colorPalettes.default;

  const applyPalette = useCallback((key: string) => {
    setPaletteKey(key);
    if (key === 'default') {
      localStorage.removeItem('colorPalette');
      localStorage.removeItem('paletteColors');
    } else {
      localStorage.setItem('colorPalette', key);
      localStorage.setItem('paletteColors', JSON.stringify(colorPalettes[key]?.colors));
    }
  }, []);

  // Set CSS variables on :root whenever palette changes
  useEffect(() => {
    const colors = palette.colors;
    if (paletteKey === 'default') {
      // Default palette resets to hardcoded Win98 visual defaults
      document.documentElement.style.setProperty('--palette-color-1', '#000000');
      document.documentElement.style.setProperty('--palette-color-2', '#808080');
      document.documentElement.style.setProperty('--palette-color-3', '#e0e0e0');
      document.documentElement.style.setProperty('--palette-color-4', '#e0e0e0');
    } else {
      document.documentElement.style.setProperty('--palette-color-1', colors[0]);
      document.documentElement.style.setProperty('--palette-color-2', colors[1]);
      document.documentElement.style.setProperty('--palette-color-3', colors[3]);
      document.documentElement.style.setProperty('--palette-color-4', colors[3]);
    }
  }, [palette, paletteKey]);

  const getDesktopBackground = useCallback((): React.CSSProperties => {
    if (paletteKey === 'dark') {
      const url = getImageUrl('dark-Backgroundpixels');
      return { backgroundImage: url ? `url(${url})` : 'none', backgroundRepeat: 'repeat', backgroundPosition: '0 0', backgroundSize: 'auto' };
    }
    if (paletteKey === 'default') {
      const url = getImageUrl('backgroundpixels');
      return { backgroundImage: url ? `url(${url})` : 'none', backgroundRepeat: 'repeat', backgroundPosition: '0 0', backgroundSize: 'auto' };
    }
    // For themed palettes, desktop background is handled via pseudo-element (CSS variables)
    return { backgroundImage: 'none' };
  }, [paletteKey]);

  const getDesktopBeforeStyle = useCallback((): React.CSSProperties => {
    if (paletteKey === 'default' || paletteKey === 'dark') {
      return { display: 'none' };
    }
    const url = getImageUrl('backgroundpixels');
    return {
      backgroundImage: url ? `url(${url})` : 'none',
      backgroundRepeat: 'repeat',
      backgroundPosition: '0 0',
      backgroundSize: 'auto',
      filter: THEME_FILTERS[paletteKey] || 'none',
    };
  }, [paletteKey]);

  const getDesktopOverlayStyle = useCallback((): React.CSSProperties => {
    if (paletteKey === 'default' || paletteKey === 'dark') {
      return { display: 'none' };
    }
    return {
      backgroundColor: THEME_OVERLAYS[paletteKey] || 'transparent',
    };
  }, [paletteKey]);

  const getWindowBodyStyle = useCallback((): React.CSSProperties => {
    if (paletteKey === 'default') {
      return { backgroundColor: '#e0e0e0', borderColor: '#808080' };
    }
    return { backgroundColor: palette.colors[3], borderColor: palette.colors[1] };
  }, [paletteKey, palette]);

  const getButtonStyle = useCallback((): React.CSSProperties => {
    if (paletteKey === 'default') {
      return { backgroundColor: '#c0c0c0', color: '#000000' };
    }
    const colors = palette.colors;
    return { backgroundColor: colors[0], color: colors[3] };
  }, [paletteKey, palette]);

  return (
    <ThemeContext.Provider value={{
      paletteKey,
      palette,
      applyPalette,
      getDesktopBackground,
      getDesktopBeforeStyle,
      getDesktopOverlayStyle,
      getWindowBodyStyle,
      getButtonStyle,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
