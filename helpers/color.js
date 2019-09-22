const colorThief = require('colorthief');
const colorContrast = require('color-contrast');

module.exports = {
  rgb2hex(rgb) {
    return "#" + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
  },

  hex(x) {
    const hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
  },

  async getBackgroundColorFromImage(image) {
    const ratio = 1.8;
    const dominant = await colorThief.getColor(image);
    const dominantHex = rgb2hex(dominant);
    if (colorContrast(dominantHex, '#fff') >= ratio) {
      return dominantHex;
    } else {
      const palette = await colorThief.getPalette(image);
      const paletteHex = palette.map(color => rgb2hex(color));
      for (let i = 0; i < paletteHex.length; i++) {
        const currentColor = paletteHex[i];
        if (colorContrast(currentColor, '#fff') >= ratio) {
          return currentColor;
        }
      }
    }
    // if all else fails
    return '#011B33';
  }
}