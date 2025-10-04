/**
 * Helper function to get the correct asset path for GitHub Pages deployment
 * @param assetPath - The asset path (e.g., '/image.png')
 * @returns The full path with basePath for production
 */
export function getAssetPath(assetPath: string): string {
  const basePath = process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''
  return `${basePath}${assetPath}`
}

/**
 * Helper function to get the correct image path for Next.js Image component
 * @param imagePath - The image path (e.g., '/image.png')
 * @returns The full path with basePath for production
 */
export function getImageSrc(imagePath: string): string {
  return getAssetPath(imagePath)
}