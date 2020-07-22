const puppeteer = require('puppeteer');
const path = require('path');

module.exports = {
  async generateCoverImage({ color, month, year }) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] }); // only doing this cos I'm loading a local file I trust
    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 640, deviceScaleFactor: 4 });
    await page.goto(`file://${path.join(`${process.cwd()}/views/covers.html`)}?color=${color.replace('#', '%23')}&month=${month}&year=${year}`);
    const encodedImage = await page.screenshot({ type: 'jpeg', encoding: 'base64' });

    return encodedImage;
  },
};
