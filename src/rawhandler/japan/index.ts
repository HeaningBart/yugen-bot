import { Browser } from "puppeteer";
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin())
const { jp_login, jp_pwd, vpn_user, vpn_password, vpn_url } = require('../../../config.json');
import downloader from 'nodejs-file-downloader'
import util from 'util';
const exec = util.promisify(require('child_process').exec);
import fs from 'fs/promises'
import { waifu } from '../index';

export async function start() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', `--proxy-server=https://jp608.nordvpn.com:89` ], headless: false });
    return browser;
}

const get_checksum = (img_url: string) => {
    const split_url = img_url.split('/');
    return split_url[split_url.length -2];
}


// const get_seed = (img_url: string, key: string) => {
//     var checksum = get_checksum(img_url);
//     const length = checksum.length;

//     for(let i = 0; i <= key.length - 1; i++){
//             if (parseInt(key[i]) !== 0){
//                 checksum = checksum.slice(-key[i]) + checksum.slice(0, length - parseInt(key[i]));
//             }
//         }

//     return checksum;


// }


export async function logIn(browser: Browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('eu estou aqui');
    await page.authenticate({
        username: vpn_user,
        password: vpn_password
    })
    await page.goto('https://piccoma.com/web/acc/email/signin', {timeout: 0});
    await page.type('input[name="email"]', jp_login);
    await page.type('input[name="password"]', jp_pwd);
    await page.evaluate(() => {
        var form = document.querySelector('form');
        if(form){
            form.submit();
        }
    })
    await page.waitForTimeout(5000);
    await page.close();
}


export async function getLatestChapter(series_id: string | number,  series_name: string, browser: Browser){
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`https://piccoma.com/web/product/${series_id}/episodes?etype=E`, {timeout: 0});
    const chapter_id = await page.evaluate(() => {
        const chapters = document.querySelectorAll(`a[data-user_access="require"]`);
        const id = chapters[chapters.length - 1].getAttribute('data-episode_id');
        return id;
    })
    await page.click(`a[data-episode_id="${chapter_id}"]`);
    await page.waitForTimeout(5000);
    try {
        await page.click('div.jconfirm-buttons > button', {delay: 5000, clickCount: 10})
    } catch (error) {
        console.log(error)
    }
    await page.waitForTimeout(15000);
    const chapter_data = await page.evaluate(() => {
        //@ts-ignore
        const data = _pdata_;
        return data;
    })
    var img_data = chapter_data.img.map((item:any) => item.path);
    const chapter_number = chapter_data.title.replaceAll(/\D/g, "");
    
    img_data = img_data.filter((item:any) => item !== null && typeof item !== undefined && item !== ''); 

    const directory = `chapter-${chapter_number}-${series_name}`
    const waifu_directory = `waifu-${chapter_number}-${series_name}`


    const img_array = img_data.map((item:any, index:any) => new downloader({
        url: 'https://' + item,
        directory: `./${directory}`,
        fileName: `${index}.jpg`
    }))

    const expires_array = img_data.map((item:any) => {
        const x = new URLSearchParams(item);
        return x.get('expires');
    })

    console.log(img_data);
    console.log(expires_array);


    const seeds_array = img_data.map((item:any, index:any) => {
        console.log(item);
        const key = expires_array[index];
        var checksum = `${get_checksum(item)}`;
        console.log(checksum)
        console.log(key);

        for(let i = 0; i <= key.length - 1; i++){
            if (key[i] !== 0){
                checksum = checksum.slice(-key[i]) + checksum.slice(0, checksum.length - parseInt(key[i]));
            }
        }

        return checksum;
    })
    
    console.log(seeds_array);

    try {
        await Promise.all(img_array.map((item:any) => item.download()))
        console.log('All images have been downloaded.')
    } catch (error) {
        
    }

    for(let i = 0; i <= img_data.length - 1; i++){
        try {
            await exec(`pycasso ${directory}/${i}.jpg ${directory}/output/${i} scramble -n 50 50 -s ${seeds_array[i]} -f jpeg`)
        } catch (error) {             
        }
    }

    try {
        await exec(`python3 src/rawhandler/SmartStitchConsole.py -i "${directory}/output" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`);
        console.log('All images have been stitched.')

        await exec(`./waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/output/Stitched -f jpg -j 2:2:2`, { cwd: waifu })
        console.log('All images have been through waifu-2x-caffe.')

        await exec(`7z a public/${directory}.7z  ./${waifu_directory}/*`)

        fs.rm(`./${directory}`, { recursive: true })
        fs.rm(`./${waifu_directory}`, { recursive: true })

        console.log('Temp directories are being removed.')

        return `${directory}.7z`


    } catch (error) {
        
    }


}



// export async function downloadChapter(chapter_id: number | string, browser: Browser, series_name: string){
//     const page = await browser.newPage();
//     await page.setViewport({ width: 1080, height: 1080 });
//     await page.goto(`https://view.ridibooks.com/books/${chapter_id}`, { waitUntil: 'domcontentloaded'});
//     try {
//         const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
//         const chapter_response = await chapter.json();
//         const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
//         console.log(chapter_number);
//         const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
//         const ridi_response = await response.json();
//         const ridi_files = ridi_response.pages;
//         console.log(ridi_files);
//         const files_url = ridi_files.map((file: any) => file.src);
//         console.log(files_url);
//         console.log(chapter_number);
//         const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
//         console.log(file_to_be_returned);
//         return file_to_be_returned;
//     } catch (error) {
//         console.log('0 try didnt go well')
//         console.log(error);
//     }
//     await page.waitForNetworkIdle();
//     try {
//         await page.evaluate(() => {
//             const button = document.querySelector('div.next_volume_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
//             //@ts-ignore
//             if(button) button.click()
//         })
//     } catch (error) {
        
//     }
//     await page.waitForNetworkIdle();
//     try {
//         await page.evaluate(() => {
//             const button = document.querySelector('div.serial_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
//             //@ts-ignore
//             if(button) button.click()
//         })
//     } catch (error) {
        
//     }
//     await page.waitForNetworkIdle();
//     try {
//         await page.evaluate(() => {
//             const button = document.querySelector('div.serial_checkout_wrapper > div.checkout_contents_wrapper > div.checkout_buttons > button.button_size_40')
//             //@ts-ignore
//             if(button) button.click()
//         })
//     } catch (error) {
        
//     }
//     try {
//         const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
//         const chapter_response = await chapter.json();
//         const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
//         const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
//         const ridi_response = await response.json();
//         const ridi_files = ridi_response.pages;
//         console.log(ridi_files);
//         const files_url = ridi_files.map((file: any) => file.src);
//         console.log(files_url);
//         const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
//         console.log(file_to_be_returned);
//         return file_to_be_returned;
//     } catch (error) {
//         console.log('first try didnt go well')
//         console.log(error);
//     }
//     await page.waitForNetworkIdle();
//     try {
//         const chapter = await page.waitForResponse(`https://book-api.ridibooks.com/books/${chapter_id}`, { timeout: 5 * 1000 });
//         const chapter_response = await chapter.json();
//         const chapter_number = chapter_response.title.main.split(' ').find((element: string) => element.includes('화'))?.replaceAll(/\D/g, "");
//         const response = await page.waitForResponse(`https://view.ridibooks.com/generate/${chapter_id}`, { timeout: 5 * 1000 });
//         const ridi_response = await response.json();
//         const ridi_files = ridi_response.pages;
//         console.log(ridi_files);
//         const files_url = ridi_files.map((file: any) => file.src);
//         console.log(files_url);
//         const file_to_be_returned = await handleChapter(files_url, chapter_number, series_name);
//         console.log(file_to_be_returned);
//         return file_to_be_returned;
//     } catch (error) {
//         console.log('second try didnt go well')
//         console.log(error);
//     }
// }


// const test = async () => {
//     const browser = await start();
//     await logIn(browser);
//     await getLatestChapter(81737, browser, 'duke-pendragon');

// }

// test();