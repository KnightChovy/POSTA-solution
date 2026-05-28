const replaceImagesInContent = (content, newImages = []) => {
  try {
    const matches = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/g);

    console.log("Matches:", matches);
    console.log("New Images:", newImages);

    if (!matches || matches.length === 0) {
      // No images in content, return as-is
      return content;
    }

    if (newImages.length === 0) {
      // No new images provided, return as-is
      return content;
    }

    // Replace images using the minimum of available matches and new images
    let index = 0;
    const maxReplacements = Math.min(matches.length, newImages.length);

    return content.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/g, (match) => {
      if (index < maxReplacements) {
        const newSrc = newImages[index++];
        return match.replace(/src=["'][^"']+["']/, `src="${newSrc}"`);
      }
      return match; // Keep original if no more new images
    });
  } catch (error) {
    console.log(error);
    throw new Error("Lỗi khi thay thế ảnh trong nội dung: " + error.message);
  }
};
module.exports = { replaceImagesInContent };
