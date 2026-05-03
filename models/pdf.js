const puppeteer = require("puppeteer-core")
const chromium = require("@sparticuz/chromium")

const generatePDF = async (html) => {
const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
})
  const page = await browser.newPage()
  await page.setContent(html,{waitUntil: "networkidle0"
  })
  const pdfBuffer = await page.pdf({
    format: "A4"
  })

  await browser.close()
  return pdfBuffer
}
module.exports = generatePDF