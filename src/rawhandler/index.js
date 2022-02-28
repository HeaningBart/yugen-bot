// Requirements
const puppeteer = require('puppeteer');
const download = require('download')
const util = require('util')
const exec = util.promisify(require('child_process').exec);
const Zip = require('adm-zip');
const fs = require('fs').promises
const path = require('path');
const randomstring = require('randomstring');
const { email, password } = require('../../config.json');



// Relative paths
const waifu = path.resolve(__dirname);



const handleNoWaifuChapter = async (images_array, number) => {
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

        await exec(`python3 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 10000 -cw 800 -w 2 -t ".jpeg" -s 90`);
        console.log('All images have been stitched.')

        await exec(`7z a ${chaptername}.7z  ./${directory}/Stitched/*`)

        await fs.rm(`./${directory}`, { recursive: true })

        console.log('Temporary directories have been removed.')

        return `./${chaptername}.7z`
    } catch (error) {
        console.log(error);
        console.log(`An error in chapter ${number} has occurred during download/stitching/waifu.`)
    }
}




const handleChapter = async (images_array, number) => {
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

        await exec(`python3 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 10000 -cw 800 -w 2 -t ".jpeg" -s 90`);
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


const translateOnly = async (seriesId) => {
    let series_url = 'https://page.kakao.com/home?seriesId=' + seriesId;
    let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesId;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const pageTarget = page.target();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto('https://page.kakao.com/main');
    await page.click('div.css-vurnku:nth-child(3)');
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
    const newPage = await newTarget.page();
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

    await page.waitForTimeout(15000);

    await page.screenshot({
        path: './afterlogintrue.png'
    })

    await page.goto(buy_url);
    await page.waitForNetworkIdle();
    await page.screenshot({
        path: './buypage.png'
    });

    let tickets = await page.evaluate(() => {
        let div = Array.from(document.querySelectorAll('div'))
        div = div.find(element => element.innerHTML.includes('대여권') && element.innerHTML.length < 20);
        var x = div.innerText.replaceAll(/\D/g, "");
        if (x == '' || !x) return 0;
        x = parseInt(x);
        return x;
    })

    // if (tickets < 20) {
    //     await page.evaluate(() => {
    //         var inputs = document.querySelectorAll('input');
    //         inputs[3].click();
    //     })
    //     await page.screenshot({ path: 'afterevaluate.png' })
    //     await page.click('button[type="submit"]');
    //     await page.click('button[type="button"].btnBuy');
    //     await page.waitForTimeout(5000);
    //     await page.click('span.btnBox');
    //     await page.waitForNavigation();
    //     await page.waitForNetworkIdle();
    // } else await page.goto(series_url);
    await page.goto(series_url);

    const free_chapters = await page.evaluate(() => {
        const chaps = document.querySelectorAll("li[data-available='true'][data-free='true']");
        return chaps.length;
    })
    tickets += free_chapters;
    tickets = 19;
    console.log(tickets);

    await page.screenshot({ path: './teste.png' });

    await page.evaluate(() => {
        const chapsnot = document.querySelectorAll("li[data-available='false']");
        for (let chap of chapsnot) {
            chap.remove();
        }
    })

    var chapters_ids = await page.evaluate(() => {
        let chapterss = Array.from(document.querySelectorAll('li[data-available="true"]'));
        let all = [];
        chapterss = chapterss.forEach((chapter, index) => all.push({ id: chapter.attributes['data-productid'].value, number: index }));
        return all;
    })

    let chapters = [];
    const downloadChapter = async (productid, number) => {
        try {
            const new_page = await browser.newPage();
            const url = 'https://page.kakao.com/viewer?productId=' + productid;
            await new_page.setViewport({ width: 1080, height: 1080 });
            await new_page.goto(url);
            console.log('vou começar a esperar agora')
            await new_page.waitForNetworkIdle({ timeout: 120 * 1000 });
            const need_ticket = await new_page.evaluate(() => {
                const button = document.querySelector('span.btnBox > span:nth-child(2)');
                if (button) return true;
                else return false;
            })
            if (need_ticket) {
                console.log('começando a esperar pela que precisa de ticket')
                await new_page.waitForNetworkIdle();
                await new_page.waitForTimeout(2000);
                let imagefiles = await new_page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
                )
                const real_number = number;
                console.log(imagefiles)
                let chapterfile = await handleNoWaifuChapter(imagefiles, real_number);
                chapters.push(chapterfile);
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
                        document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
                )
                console.log(imagefiles)
                const real_number = number;
                let chapterfile = await handleNoWaifuChapter(imagefiles, real_number);
                if (chapterfile) chapters.push(chapterfile);
                await new_page.close();
            }
        } catch (error) {
            console.log(error)
        }
    }



    // let chapters = [];
    // let go = [];
    // for (let i = 10; i < tickets; i++) {
    //     go[i] = i;
    // }

    // console.log(go);

    // const downloadChapter = async (number) => {
    //     try {

    //         const new_page = await browser.newPage();
    //         await new_page.setViewport({ width: 1080, height: 1080 });
    //         await new_page.goto(series_url);
    //         console.log('vou começar a esperar agora')
    //         await new_page.waitForNetworkIdle();

    //         await new_page.evaluate(() => {
    //             const chapsnot = document.querySelectorAll("li[data-available='false']");
    //             for (let chap of chapsnot) {
    //                 chap.remove();
    //             }
    //         })

    //         await new_page.click(`li[data-available='true']:nth-child(${number + 1})`);
    //         await new_page.waitForNavigation();
    //         await new_page.waitForNetworkIdle({ timeout: 180 * 1000 });
    //         const need_ticket = await new_page.evaluate(() => {
    //             const button = document.querySelector('span.btnBox > span:nth-child(2)');
    //             if (button) return true;
    //             else return false;
    //         })
    //         if (need_ticket) {
    //             console.log('começando a esperar pela que precisa de ticket')
    //             await new_page.waitForNetworkIdle();
    //             await new_page.waitForSelector('img.comic-viewer-content-img', { timeout: 180 * 1000 })
    //             let imagefiles = await new_page.evaluate(() =>
    //                 Array.from(
    //                     document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
    //             )
    //             const real_number = number;
    //             let chapterfile = await handleChapter(imagefiles, real_number);
    //             chapters.push(chapterfile);
    //             await new_page.close();
    //         } else {
    //             console.log('começando a esperar pela q nao precisa de ticket');
    //             console.log(new_page.url());
    //             await new_page.waitForNetworkIdle();
    //             await new_page.waitForSelector('img.comic-viewer-content-img', { timeout: 180 * 1000 })
    //             await new_page.waitForTimeout(2000);
    //             await new_page.screenshot({
    //                 path: `chapter${number}.png`
    //             })
    //             let imagefiles = await new_page.evaluate(() =>
    //                 Array.from(
    //                     document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
    //             )
    //             const real_number = number;
    //             let chapterfile = await handleChapter(imagefiles, real_number);
    //             if (chapterfile) chapters.push(chapterfile);
    //             await new_page.close();
    //         }
    //     } catch (error) {
    //         console.log(error)
    //     }


    // }
    let split_promises = [];
    var size = 4;
    for (var i = 0; i < chapters_ids.length; i += size) {
        split_promises.push(chapters_ids.slice(i, i + size));
    }

    // console.log(split_promises);
    console.log(chapters_ids);
    for (let i = 0; i <= split_promises.length - 1; i++) {
        await Promise.all(split_promises[i].map(({ id, number }) => downloadChapter(id, number)));
    }
    console.log(chapters);
    await browser.close();
    return chapters;
}

const buyTicket = async (seriesId) => {
    let series_url = 'https://page.kakao.com/home?seriesId=' + seriesId;
    let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesId;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const pageTarget = page.target();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.goto('https://page.kakao.com/main');
    await page.click('div.css-vurnku:nth-child(3)');
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget);
    const newPage = await newTarget.page();
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

    await page.waitForTimeout(15000);

    await page.screenshot({
        path: './afterlogintrue.png'
    })

    await page.goto(buy_url);
    await page.waitForNetworkIdle();
    await page.screenshot({
        path: './buypage.png'
    });

    let tickets = await page.evaluate(() => {
        let div = Array.from(document.querySelectorAll('div'))
        div = div.find(element => element.innerHTML.includes('대여권') && element.innerHTML.length < 20);
        var x = div.innerText.replaceAll(/\D/g, "");
        if (x == '' || !x) return 0;
        x = parseInt(x);
        return x;
    })

    // if (tickets < 20) {
    //     await page.evaluate(() => {
    //         var inputs = document.querySelectorAll('input');
    //         inputs[3].click();
    //     })
    //     await page.screenshot({ path: 'afterevaluate.png' })
    //     await page.click('button[type="submit"]');
    //     await page.click('button[type="button"].btnBuy');
    //     await page.waitForTimeout(5000);
    //     await page.click('span.btnBox');
    //     await page.waitForNavigation();
    //     await page.waitForNetworkIdle();
    // } else await page.goto(series_url);
    await page.goto(series_url);

    const free_chapters = await page.evaluate(() => {
        const chaps = document.querySelectorAll("li[data-available='true'][data-free='true']");
        return chaps.length;
    })
    tickets += free_chapters;
    tickets = 19;
    console.log(tickets);

    await page.screenshot({ path: './teste.png' });

    await page.evaluate(() => {
        const chapsnot = document.querySelectorAll("li[data-available='false']");
        for (let chap of chapsnot) {
            chap.remove();
        }
    })

    var chapters_ids = await page.evaluate(() => {
        let chapterss = Array.from(document.querySelectorAll('li[data-available="true"]'));
        let all = [];
        chapterss = chapterss.forEach((chapter, index) => all.push({ id: chapter.attributes['data-productid'].value, number: index }));
        return all;
    })

    let chapters = [];
    const downloadChapter = async (productid, number) => {
        try {
            const new_page = await browser.newPage();
            const url = 'https://page.kakao.com/viewer?productId=' + productid;
            await new_page.setViewport({ width: 1080, height: 1080 });
            await new_page.goto(url);
            console.log('vou começar a esperar agora')
            await new_page.waitForNetworkIdle({ timeout: 120 * 1000 });
            const need_ticket = await new_page.evaluate(() => {
                const button = document.querySelector('span.btnBox > span:nth-child(2)');
                if (button) return true;
                else return false;
            })
            if (need_ticket) {
                console.log('começando a esperar pela que precisa de ticket')
                await new_page.waitForNetworkIdle();
                let imagefiles = await new_page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
                )
                const real_number = number;
                console.log(imagefiles)
                let chapterfile = await handleChapter(imagefiles, real_number);
                chapters.push(chapterfile);
                await new_page.close();
            } else {
                console.log('começando a esperar pela q nao precisa de ticket');
                console.log(new_page.url());
                await new_page.waitForNetworkIdle();
                await new_page.screenshot({
                    path: `chapter${number}.png`
                })
                let imagefiles = await new_page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
                )
                console.log(imagefiles)
                const real_number = number;
                let chapterfile = await handleChapter(imagefiles, real_number);
                if (chapterfile) chapters.push(chapterfile);
                await new_page.close();
            }
        } catch (error) {
            console.log(error)
        }
    }



    // let chapters = [];
    // let go = [];
    // for (let i = 10; i < tickets; i++) {
    //     go[i] = i;
    // }

    // console.log(go);

    // const downloadChapter = async (number) => {
    //     try {

    //         const new_page = await browser.newPage();
    //         await new_page.setViewport({ width: 1080, height: 1080 });
    //         await new_page.goto(series_url);
    //         console.log('vou começar a esperar agora')
    //         await new_page.waitForNetworkIdle();

    //         await new_page.evaluate(() => {
    //             const chapsnot = document.querySelectorAll("li[data-available='false']");
    //             for (let chap of chapsnot) {
    //                 chap.remove();
    //             }
    //         })

    //         await new_page.click(`li[data-available='true']:nth-child(${number + 1})`);
    //         await new_page.waitForNavigation();
    //         await new_page.waitForNetworkIdle({ timeout: 180 * 1000 });
    //         const need_ticket = await new_page.evaluate(() => {
    //             const button = document.querySelector('span.btnBox > span:nth-child(2)');
    //             if (button) return true;
    //             else return false;
    //         })
    //         if (need_ticket) {
    //             console.log('começando a esperar pela que precisa de ticket')
    //             await new_page.waitForNetworkIdle();
    //             await new_page.waitForSelector('img.comic-viewer-content-img', { timeout: 180 * 1000 })
    //             let imagefiles = await new_page.evaluate(() =>
    //                 Array.from(
    //                     document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
    //             )
    //             const real_number = number;
    //             let chapterfile = await handleChapter(imagefiles, real_number);
    //             chapters.push(chapterfile);
    //             await new_page.close();
    //         } else {
    //             console.log('começando a esperar pela q nao precisa de ticket');
    //             console.log(new_page.url());
    //             await new_page.waitForNetworkIdle();
    //             await new_page.waitForSelector('img.comic-viewer-content-img', { timeout: 180 * 1000 })
    //             await new_page.waitForTimeout(2000);
    //             await new_page.screenshot({
    //                 path: `chapter${number}.png`
    //             })
    //             let imagefiles = await new_page.evaluate(() =>
    //                 Array.from(
    //                     document.querySelectorAll('img.comic-viewer-content-img'), img => img.src)
    //             )
    //             const real_number = number;
    //             let chapterfile = await handleChapter(imagefiles, real_number);
    //             if (chapterfile) chapters.push(chapterfile);
    //             await new_page.close();
    //         }
    //     } catch (error) {
    //         console.log(error)
    //     }


    // }
    let split_promises = [];
    var size = 4;
    for (var i = 0; i < chapters_ids.length; i += size) {
        split_promises.push(chapters_ids.slice(i, i + size));
    }

    // console.log(split_promises);
    console.log(chapters_ids);
    for (let i = 0; i <= split_promises.length - 1; i++) {
        await Promise.all(split_promises[i].map(({ id, number }) => downloadChapter(id, number)));
    }
    console.log(chapters);
    await browser.close();
    return chapters;
}


module.exports = { buyTicket, translateOnly };
