const colorThief = require('colorthief');
const colorContrast = require('color-contrast');

module.exports = {
  hex(x) {
    const hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    return Number.isNaN(Number(x)) ? '00' : hexDigits[(x - (x % 16)) / 16] + hexDigits[x % 16];
  },

  rgb2hex(rgb) {
    return `#${this.hex(rgb[0])}${this.hex(rgb[1])}${this.hex(rgb[2])}`;
  },

  async getBackgroundColorFromImage(image) {
    const ratio = 1.8;
    const dominant = await colorThief.getColor(image);
    const dominantHex = this.rgb2hex(dominant);
    if (colorContrast(dominantHex, '#fff') >= ratio) {
      return dominantHex;
    }
    const palette = await colorThief.getPalette(image);
    const paletteHex = palette.map((color) => this.rgb2hex(color));
    for (let i = 0; i < paletteHex.length; i += 1) {
      const currentColor = paletteHex[i];
      if (colorContrast(currentColor, '#fff') >= ratio) {
        return currentColor;
      }
    }

    // if all else fails
    return '#011B33';
  },
};
