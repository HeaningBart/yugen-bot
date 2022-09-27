import { Browser } from "puppeteer";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())
const { email, password } = require('../../../config.json');

export async function start() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false });
    return browser;
}


export async function logIn(browser: Browser) {
    const page = await browser.newPage();
    const pageTarget = page.target();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('eu estou aqui');
    await page.goto('https://page.kakao.com/');
    await page.click('img[alt="내 정보"]');
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
    const newPage = await newTarget.page();
    if (newPage) {
        await newPage.waitForNetworkIdle({ idleTime: 5000 });
        console.log('estou aqui');
        console.log(newPage.url());
        await newPage.waitForTimeout(5000)
        await newPage.setViewport({ width: 1080, height: 1080 });
        await newPage.screenshot({ path: './beforelogin.png' })
        await newPage.type('input[type="text"]', email);
        await newPage.type('input[name="password"]', password);
        await newPage.click('input[type="checkbox"]');
        await newPage.keyboard.press('Enter')
        await newPage.screenshot({
            path: './afterlogin.png'
        });
    }
    await page.waitForTimeout(15000);
    await page.goto('https://page.kakao.com/content/50289296')
    const cookies = await page.cookies();

    const new_cookies = cookies.map((item) => `${item.name}=${item.value};`)

    const filtered_cookies = new_cookies.join(' ')

    console.log(filtered_cookies);

    return { cookies: filtered_cookies };
}


export async function buyTicket(browser: Browser, series_id: string) {
    let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + series_id;
    const new_page = await browser.newPage();
    await new_page.setViewport({ width: 1080, height: 1080 });
    await new_page.goto(buy_url);
    await new_page.waitForNetworkIdle();
    await new_page.click('button[type="submit"]');
    await new_page.click('button[type="button"].btnBuy');
    await new_page.waitForTimeout(2000);
    await new_page.click('span.btnBox');
    await new_page.waitForNetworkIdle();
    await new_page.close();
}