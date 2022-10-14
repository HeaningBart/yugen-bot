import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
const { email, password } = require("../../../config.json");

export async function start() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: false,
  });
  return browser;
}

const important_cookies = ["_kpw_katkn", "_kpwtkn", "_kawlt"];

const cookies_for_login = ["_kpdid"];

export async function logIn(browser: Browser) {
  const page = await browser.newPage();
  const pageTarget = page.target();
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("eu estou aqui");
  try {
    await page.goto("https://page.kakao.com/", { timeout: 15000 });
  } catch (error) {}
  await page.click('img[alt="내 정보"]');
  const newTarget = await browser.waitForTarget(
    (target) => target.opener() === pageTarget
  );
  const newPage = await newTarget.page();
  let x = "";
  if (newPage) {
    await newPage.waitForTimeout(5000);
    console.log("estou aqui");
    console.log(newPage.url());
    await newPage.setViewport({ width: 1080, height: 1080 });
    await newPage.setRequestInterception(true);
    const new_cookies = (await newPage.cookies()).map((item) => {
      if (!cookies_for_login.includes(item.name)) {
        return `${item.name}=${item.value};`;
      }
    });
    newPage.on("request", async (interceptedRequest) => {
      if (
        interceptedRequest.url() ===
        "https://accounts.kakao.com/weblogin/authenticate.json"
      ) {
        console.log(interceptedRequest.url());
        const data = interceptedRequest.postData();
        if (data) {
          console.log(data);
          x = data;
        }
      }
    });

    console.log(x);

    await newPage.screenshot({ path: "./beforelogin.png" });
    await newPage.type('input[type="text"]', email);
    await newPage.type('input[name="password"]', password);
    await newPage.click('input[type="checkbox"]');
    await newPage.keyboard.press("Enter");
  }

  return { data: x };
}

export async function buyTicket(browser: Browser, series_id: string) {
  let buy_url = "https://page.kakao.com/buy/ticket?seriesId=" + series_id;
  const new_page = await browser.newPage();
  await new_page.setViewport({ width: 1080, height: 1080 });
  await new_page.goto(buy_url);
  await new_page.waitForNetworkIdle();
  await new_page.click('button[type="submit"]');
  await new_page.click('button[type="button"].btnBuy');
  await new_page.waitForTimeout(2000);
  await new_page.click("span.btnBox");
  await new_page.waitForNetworkIdle();
  await new_page.close();
}
