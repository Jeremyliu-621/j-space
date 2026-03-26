// Import all images from src/assets eagerly
const images = import.meta.glob('../assets/*.*', { eager: true }) as Record<string, { default: string }>;

// Helper to get image URL by filename (partial match, case-insensitive)
export function getImageUrl(filename: string): string | null {
  const lowerFilename = filename.toLowerCase();
  for (const path in images) {
    if (path.toLowerCase().includes(lowerFilename)) {
      return images[path].default;
    }
  }
  return null;
}
