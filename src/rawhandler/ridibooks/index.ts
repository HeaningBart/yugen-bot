import { Browser } from "puppeteer";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())
const { username, pwd } = require('../../../config.json');
import { handleChapter } from '../index';

export async function start() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: false });
    return browser;
}


export async function logIn(browser: Browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    console.log('eu estou aqui');
    await page.goto('https://ridibooks.com/account/login');
    await page.type('input[name="user_id"]', username);
    await page.type('input[name="password"]', pwd);
    await page.click('input[name="auto_login"]');
    await page.click('button.login-button');
    await page.waitForTimeout(5000);
    await page.close();
}


export async function getLatestChapter(series_id: string | number, browser: Browser){
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto(`https://ridibooks.com/books/${series_id}`);
    const chapter_id = await page.evaluate(() => {
        const chapters = document.querySelectorAll('li.js_series_book_list');
        const id = chapters[chapters.length - 1].getAttribute('data-id');
        return id;
    })
    return chapter_id;
}



export async function downloadChapter(chapter_id: number | string, browser: Browser, series_name: string){
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto(`https://view.ridibooks.com/books/${chapter_id}`, { waitUntil: 'domcontentloaded'});
    try {
        const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
        const chapter_response = await chapter.json();
        const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
        console.log(chapter_number);
        const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
        const ridi_response = await response.json();
        const ridi_files = ridi_response.pages;
        console.log(ridi_files);
        const files_url = ridi_files.map((file: any) => file.src);
        console.log(files_url);
        console.log(chapter_number);
        const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
        console.log(file_to_be_returned);
        return file_to_be_returned;
    } catch (error) {
        console.log('0 try didnt go well')
        console.log(error);
    }
    await page.waitForNetworkIdle();
    try {
        await page.evaluate(() => {
            const button = document.querySelector('div.next_volume_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
            //@ts-ignore
            if(button) button.click()
        })
    } catch (error) {
        
    }
    await page.waitForNetworkIdle();
    try {
        await page.evaluate(() => {
            const button = document.querySelector('div.serial_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
            //@ts-ignore
            if(button) button.click()
        })
    } catch (error) {
        
    }
    await page.waitForNetworkIdle();
    try {
        await page.evaluate(() => {
            const button = document.querySelector('div.serial_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
            //@ts-ignore
            if(button) button.click()
        })
    } catch (error) {
        
    }
    try {
        const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
        const chapter_response = await chapter.json();
        const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
        const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
        const ridi_response = await response.json();
        const ridi_files = ridi_response.pages;
        console.log(ridi_files);
        const files_url = ridi_files.map((file: any) => file.src);
        console.log(files_url);
        const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
        console.log(file_to_be_returned);
        return file_to_be_returned;
    } catch (error) {
        console.log('first try didnt go well')
        console.log(error);
    }
    await page.waitForNetworkIdle();
    try {
        const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
        const chapter_response = await chapter.json();
        const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
        const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
        const ridi_response = await response.json();
        const ridi_files = ridi_response.pages;
        console.log(ridi_files);
        const files_url = ridi_files.map((file: any) => file.src);
        console.log(files_url);
        const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
        console.log(file_to_be_returned);
        return file_to_be_returned;
    } catch (error) {
        console.log('second try didnt go well')
        console.log(error);
    }
}


const test = async () => {
    const browser = await start();
    await logIn(browser);
    const chapter_id = await getLatestChapter(4291002928, browser);
    if (chapter_id) await downloadChapter(chapter_id, browser, 'terrarium-adventure');
}

test();