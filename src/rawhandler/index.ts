import puppeteer, { Browser } from 'puppeteer';
import download from 'download';
import util from 'util';
const exec = util.promisify(require('child_process').exec);
import fs from 'fs/promises'
import path from 'path';
import randomstring from 'randomstring';
const { email, password } = require('../../config.json');

// Relative paths
const waifu = path.resolve(__dirname);

type chapterItem = {
    id: string;
    number: string;
}

type ChapterProps = {
    attributes: {
        'data-productid': {
            value: string;
        }
    }
}

type Chapter = HTMLDivElement & ChapterProps;

async function handleChapter(images_array: string[], number: string) {
    try {
        const random = randomstring.generate();
        const directory = `dist-${number}-${random}`;
        const waifu_directory = `waifu-${number}-${random}`;
        const chaptername = `chapter-${number}-${random}`;

        await fs.mkdir(waifu_directory);

        await Promise.all(images_array.map((image, index) => download(image, `./${directory}`, {
            filename: `image-${index}.jpeg`
        })));
        console.log('All images have been downloaded.')

        await exec(`python3 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 10000 -cw 800 -w 2 -t ".png" -s 90`);
        console.log('All images have been stitched.')

        await exec(`./waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg`, { cwd: waifu })
        console.log('All images have been through waifu-2x-caffe.')

        await exec(`7z a ${chaptername}.7z  ./${waifu_directory}/*`)

        await fs.rm(`./${directory}`, { recursive: true })
        await fs.rm(`./${waifu_directory}`, { recursive: true })

        console.log('Temporary directories have been removed.')

        return `./${chaptername}.7z`
    } catch (error) {
        console.log(error);
        console.log(`An error in chapter ${number} has occurred during download/stitching/waifu.`)
    }
}

async function handleTicket(seriesId: string, starts_at: number) {
    const series_url = 'https://page.kakao.com/home?seriesId=' + seriesId;
    const buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesId;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const pageTarget = page.target();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto('https://page.kakao.com/main');
    await page.click('div.css-vurnku:nth-child(3)');
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
    const newPage = await newTarget.page();
    if (newPage) {
        await newPage.waitForNetworkIdle();
        await newPage.screenshot({
            path: './kakaologin.png'
        })
        console.log(newPage.url());
        await newPage.setViewport({ width: 1080, height: 1080 });
        await newPage.type('input[name="email"]', email);
        await newPage.type('input[name="password"]', password);
        await newPage.click('input#staySignedIn');
        await newPage.click('button.btn_confirm');



        await newPage.screenshot({
            path: './afterlogin.png'
        });
    }

    await page.waitForTimeout(15000);

    await page.screenshot({
        path: './afterlogintrue.png'
    })

    await page.goto(buy_url);
    await page.waitForNetworkIdle();
    await page.screenshot({
        path: './buypage.png'
    });

    await page.evaluate(() => {
        var inputs = document.querySelectorAll('input');
        inputs[3].click();
    })
    await page.screenshot({ path: 'afterevaluate.png' })
    await page.click('button[type="submit"]');
    await page.click('button[type="button"].btnBuy');
    await page.waitForTimeout(5000);
    await page.click('span.btnBox');
    await page.waitForNavigation();
    await page.waitForNetworkIdle();
    await page.goto(series_url);

    await page.waitForNetworkIdle();

    await page.screenshot({ path: './teste.png' });

    await page.evaluate(() => {
        const chapsnot = document.querySelectorAll<HTMLDivElement>("li[data-available='false']");
        for (let chap of chapsnot) {
            chap.remove();
        }
    })

    var chapters_ids = await page.evaluate(() => {
        let chapters = Array.from(document.querySelectorAll<Chapter>('li[data-available="true"]'));
        let all: chapterItem[] = [];
        chapters.forEach((chapter, index) => all.push({ id: chapter.attributes['data-productid'].value, number: index.toString() }));
        return all;
    })

    let chapters: string[] = [];

    const downloadChapter = async (productid: string, number: number, starts_at: number) => {
        try {
            const new_page = await browser.newPage();
            const url = 'https://page.kakao.com/viewer?productId=' + productid;
            await new_page.setViewport({ width: 1080, height: 1080 });
            await new_page.goto(url);
            console.log('vou começar a esperar agora')
            await new_page.waitForNetworkIdle({ timeout: 120 * 1000 });
            await new_page.waitForTimeout(2000);
            const need_ticket = await new_page.evaluate(() => {
                const button = document.querySelector('span.btnBox > span:nth-child(2)');
                if (button) return true;
                else return false;
            })
            if (need_ticket) {
                console.log('começando a esperar pela que precisa de ticket')
                await new_page.waitForNetworkIdle();
                await new_page.evaluate(() => {
                    const button = document.querySelector<HTMLButtonElement>('span.btnBox > span:nth-child(2)')!;
                    button.click();
                })
                let imagefiles = await new_page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                )
                const real_number = number + starts_at;
                console.log(imagefiles)
                let chapterfile = await handleChapter(imagefiles, real_number.toString());
                if (chapterfile) chapters.push(chapterfile);
                await new_page.close();
            } else {
                console.log('começando a esperar pela q nao precisa de ticket');
                console.log(new_page.url());
                await new_page.waitForNetworkIdle();
                await new_page.waitForTimeout(2000);
                await new_page.screenshot({
                    path: `chapter${number}.png`
                })
                let imagefiles = await new_page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                )
                console.log(imagefiles)
                const real_number = number + starts_at;
                let chapterfile = await handleChapter(imagefiles, real_number.toString());
                if (chapterfile) chapters.push(chapterfile);
                await new_page.close();
            }
        } catch (error) {
            console.log(error)
        }
    }

    let split_promises = [];
    var size = 4;
    for (var i = 0; i < chapters_ids.length; i += size) {
        split_promises.push(chapters_ids.slice(i, i + size));
    }

    // console.log(split_promises);
    console.log(chapters_ids);
    for (let i = 0; i <= split_promises.length - 1; i++) {
        await Promise.all(split_promises[i].map(({ id, number }) => downloadChapter(id, parseInt(number), starts_at)));
    }
    console.log(chapters);
    await browser.close();
    return chapters;
}

async function ripLatest(series_array: string[]) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const pageTarget = page.target();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto('https://page.kakao.com/main');
    await page.click('div.css-vurnku:nth-child(3)');
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
    const newPage = await newTarget.page();
    if (newPage) {
        await newPage.waitForNetworkIdle();
        console.log(newPage.url());
        await newPage.setViewport({ width: 1665, height: 941 });
        await newPage.type('input[name="email"]', email);
        await newPage.type('input[name="password"]', password);
        await newPage.click('input#staySignedIn');
        await newPage.click('button.btn_confirm');
        await newPage.screenshot({
            path: './afterlogin.png'
        });
    }






    await page.waitForTimeout(20000);

    await page.screenshot({
        path: './afterlogintrue.png'
    })
    let chapters: string[] = [];

    const handleSeries = async (seriesID: string, browser: Browser) => {
        let series_url = 'https://page.kakao.com/home?seriesId=' + seriesID + '&orderby=desc';
        let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesID;

        console.log(series_url)
        console.log(buy_url);
        const new_page = await browser.newPage();
        await new_page.setViewport({ width: 1665, height: 941 });
        // await series_page.goto(buy_url);
        // await series_page.waitForNetworkIdle();
        // await series_page.click('button[type="submit"]');
        // await series_page.click('button[type="button"].btnBuy');
        // await series_page.waitForTimeout(5000);
        // await series_page.click('span.btnBox');
        // await series_page.waitForNavigation();
        // await series_page.waitForNetworkIdle();
        await new_page.goto(series_url);

        await new_page.waitForNetworkIdle();
        let chapter_id = await new_page.evaluate(() => {
            let chapterss = Array.from(document.querySelectorAll<Chapter>('li[data-available="true"]'));
            let all: string[] = [];
            chapterss.forEach((chapter, index) => all.push(chapter.attributes['data-productid'].value));
            return all[0];
        })

        console.log(chapter_id);

        const downloadChapter = async (productid: string) => {
            try {
                const url = 'https://page.kakao.com/viewer?productId=' + productid;
                await new_page.goto(url);
                console.log('vou começar a esperar agora')
                await new_page.waitForNetworkIdle({ timeout: 120 * 1000 });
                const need_ticket = await new_page.evaluate(() => {
                    const button = document.querySelector<HTMLDivElement>('div.preventMobileBodyScroll');
                    if (button) return true;
                    else return false;
                })
                if (need_ticket) {
                    console.log('começando a esperar pela que precisa de ticket')
                    await new_page.waitForNetworkIdle();
                    await new_page.waitForTimeout(2000);
                    await new_page.screenshot({ path: `chapter-${productid}.jpeg` })
                    await new_page.evaluate(() => {
                        const button = document.querySelector<HTMLButtonElement>('span.btnBox > span:nth-child(2)')!;
                        button.click();
                    })
                    await new_page.evaluate(() => {
                        const button = document.querySelector<HTMLButtonElement>('span.btnBox > span:nth-child(2)')!;
                        button.click();
                    })
                    let real_number = 'latest';
                    let imagefiles = await new_page.evaluate(() =>
                        Array.from(
                            document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                    )
                    console.log(imagefiles)
                    let chapterfile = await handleChapter(imagefiles, real_number);
                    if (chapterfile) chapters.push(chapterfile);
                    else chapters.push(`./chapter-${productid}.jpeg`);
                    await new_page.close();
                } else {
                    console.log('começando a esperar pela q nao precisa de ticket');
                    await new_page.waitForNetworkIdle();
                    await new_page.waitForTimeout(2000);
                    await new_page.screenshot({ path: `chapter-${productid}.jpeg` })
                    console.log(new_page.url());
                    let real_number = 'latest';
                    await new_page.screenshot({
                        path: `chapter${productid}.jpeg`
                    })
                    let imagefiles = await new_page.evaluate(() =>
                        Array.from(
                            document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                    )
                    console.log(imagefiles)
                    let chapterfile = await handleChapter(imagefiles, real_number);
                    if (chapterfile) chapters.push(chapterfile);
                    else chapters.push(`./chapter-${productid}.jpeg`);
                    await new_page.close();
                }
            } catch (error) {
                console.log(error)
                return `./chapter-${productid}.jpeg`
            }
        }

        await downloadChapter(chapter_id);

    }


    let split_promises = [];
    var size = 4;
    for (var i = 0; i < series_array.length; i += size) {
        split_promises.push(series_array.slice(i, i + size));
    }

    console.log(series_array);
    for (let i = 0; i <= split_promises.length - 1; i++) {
        await Promise.all(split_promises[i].map((series) => handleSeries(series, browser)));
    }
    console.log(chapters);
    await browser.close();
    return chapters;
}


export { handleChapter, handleTicket, ripLatest };

// const handleWeeklySeries = async (series_array) => {
//     const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//     const page = await browser.newPage();
//     const pageTarget = page.target();
//     await page.setViewport({ width: 1080, height: 1080 });
//     await page.goto('https://page.kakao.com/main');
//     await page.click('div.css-vurnku:nth-child(3)');
//     const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
//     const newPage = await newTarget.page();
//     await newPage.waitForNetworkIdle();
//     await newPage.screenshot({
//         path: './kakaologin.png'
//     })
//     console.log(newPage.url());
//     await newPage.setViewport({ width: 1080, height: 1080 });
//     await newPage.type('input[name="email"]', email);
//     await newPage.type('input[name="password"]', password);
//     await newPage.click('input#staySignedIn');
//     await newPage.click('button.btn_confirm');



//     await newPage.screenshot({
//         path: './afterlogin.png'
//     });

//     await page.waitForTimeout(15000);

//     await page.screenshot({
//         path: './afterlogintrue.png'
//     })


//     const buyLatest = async (seriesId) => {
//         let series_url = 'https://page.kakao.com/home?seriesId=' + seriesId + '&orderby=desc';
//         let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesId;

//         const new_page = await browser.newPage()
//         await new_page.goto(buy_url);
//         await new_page.waitForNetworkIdle();
//         await new_page.screenshot({
//             path: './buypage.png'
//         });


//         await new_page.evaluate(() => {
//             var inputs = document.querySelectorAll('input');
//             inputs[1].click();
//         })
//         await new_page.screenshot({ path: 'afterevaluate.png' })
//         await new_page.click('button[type="submit"]');
//         await new_page.click('button[type="button"].btnBuy');
//         await new_page.waitForTimeout(5000);
//         await new_page.click('span.btnBox');
//         await new_page.waitForNavigation();
//         await new_page.waitForNetworkIdle();
//         await new_page.goto(series_url);
//         chosen.innerText.replaceAll(/\D/g, "")

//         var chapters_id = await page.evaluate(() => {
//             let chapterss = Array.from(document.querySelectorAll('li[data-available="true"]'));
//             let all = [];
//             chapterss = chapterss.forEach((chapter, index) => all.push({ id: chapter.attributes['data-productid'].value, number: index }));
//             return all[0];
//         })





//     }


// }



