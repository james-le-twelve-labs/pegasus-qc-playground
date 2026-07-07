// Records the hero flow: pick card-shuffle → Run QC → timeline lights up →
// click the defect chip → warping clip plays under the FAIL banner.
const { chromium } = require("playwright")

const CHROME =
  "/Users/le_james94/.agent-browser/browsers/chrome-150.0.7871.46/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
const OUT_DIR = process.argv[2] || "."

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function moveAndClick(page, locator, { settle = 350 } = {}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error("target not visible")
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y, { steps: 22 })
  await sleep(settle)
  await page.mouse.down()
  await sleep(90)
  await page.mouse.up()
}

;(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
  })
  const page = await context.newPage()

  // Synthetic cursor so viewers can follow the interaction.
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const c = document.createElement("div")
      Object.assign(c.style, {
        position: "fixed",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        background: "rgba(29,28,27,0.55)",
        border: "2px solid #fff",
        boxShadow: "0 1px 5px rgba(0,0,0,0.45)",
        pointerEvents: "none",
        zIndex: 99999,
        top: "-40px",
        left: "-40px",
        transform: "translate(-50%,-50%)",
        transition: "scale 120ms",
      })
      document.body.appendChild(c)
      window.addEventListener("mousemove", (e) => {
        c.style.left = e.clientX + "px"
        c.style.top = e.clientY + "px"
      }, true)
      window.addEventListener("mousedown", () => (c.style.scale = "0.65"), true)
      window.addEventListener("mouseup", () => (c.style.scale = "1"), true)
    })
  })

  await page.goto("http://localhost:5173", { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(640, 300, { steps: 5 })
  await sleep(900)

  // 1. Pick the hero clip
  await moveAndClick(page, page.getByRole("button", { name: /Magician card shuffle/ }))
  await sleep(700)

  // 2. Run QC
  await moveAndClick(page, page.getByRole("button", { name: "Run QC" }))
  await sleep(500)

  // 3. Frame the money shot: player + timeline + banner
  await page.evaluate(() => {
    const v = document.querySelector("video")
    window.scrollTo({ top: v.getBoundingClientRect().top + window.scrollY - 16, behavior: "smooth" })
  })
  await sleep(1100)

  // 4. Click the defect chip → seeks to the warping segment and plays
  const chip = page.locator("button", { hasText: "malformed_anatomy" }).first()
  await moveAndClick(page, chip)

  // Park the cursor off the content while the clip plays
  await page.mouse.move(1150, 720, { steps: 18 })
  await sleep(5400)

  await sleep(600)
  await context.close()
  await browser.close()
  console.log("recorded")
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
