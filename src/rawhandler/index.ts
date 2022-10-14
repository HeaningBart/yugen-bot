import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import download from "download";
import util from "util";
const exec = util.promisify(require("child_process").exec);
import fs from "fs/promises";
import path from "path";
const { email, password } = require("../../config.json");
import axios from "axios";
// Relative paths
export const waifu = path.resolve(__dirname);
import { logIn, start } from "./kakao";
import randomstring from "randomstring";
import Handler from "../handlers";
import downloader from "nodejs-file-downloader";

type chapterItem = {
  id: string;
  number: string;
};

type ChapterProps = {
  attributes: {
    "data-productid": {
      value: string;
    };
  };
};

type Chapter = HTMLDivElement & ChapterProps;

type handleProps = {
  images_array: string[];
  number: string;
  title: string;
  cookies: string;
};
import BetterQueue from "better-queue";

const chapterHandler = new BetterQueue(async function (
  object: handleProps,
  cb: any
) {
  const file = await newHandleChapter(object);
  console.log("Chapter processed.");
  //@ts-ignore
  this.finishBatch(file);
});

async function newHandleChapter({
  images_array,
  number,
  title,
  cookies,
}: handleProps) {
  try {
    const random = title;
    const directory = `dist-${number}-${random}`;
    const waifu_directory = `waifu-${number}-${random}`;
    const chaptername = `chapter-${number}-${random}`;

    await fs.mkdir(waifu_directory, { recursive: true });

    const img_array = images_array.map(
      (item: any, index: any) =>
        new downloader({
          url: item,
          directory: `./${directory}`,
          fileName: `${index}.jpg`,
          headers: {
            Cookie: cookies,
          },
          maxAttempts: 5,
        })
    );

    try {
      await Promise.all(img_array.map((item: any) => item.download()));
      console.log("All images have been downloaded.");
    } catch (error) {
      console.log("There was an error downloading images: " + error);
    }

    console.log("All images have been downloaded.");

    await exec(
      `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    );
    console.log("All images have been stitched.");

    await exec(
      `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg -j 10:10:10`,
      { cwd: waifu }
    );
    console.log("All images have been through waifu-2x-caffe.");

    await exec(`7z a public/${chaptername}.7z  ./${waifu_directory}/*`);

    fs.rm(`./${directory}`, { recursive: true });
    fs.rm(`./${waifu_directory}`, { recursive: true });

    console.log("Temp directories are being removed.");

    return `${chaptername}.7z`;
  } catch (error) {
    console.log(error);
    console.log(
      `An error in chapter ${number} has occurred during download/stitching/waifu.`
    );
  }
}

async function handleChapter(
  images_array: string[],
  number: string,
  title: string,
  cookies: string
) {
  try {
    const random = title;
    const directory = `dist-${number}-${random}`;
    const waifu_directory = `waifu-${number}-${random}`;
    const chaptername = `chapter-${number}-${random}`;

    await fs.mkdir(waifu_directory, { recursive: true });

    console.log(images_array);

    try {
      await Promise.all(
        images_array.map((item, index) =>
          download(item, directory, {
            filename: `${index}.jpeg`,
            headers: {
              Cookie: `${cookies}`,
            },
          })
        )
      );
      console.log("All images have been downloaded.");
    } catch (error) {
      console.log("There was an error downloading images: " + error);
    }

    console.log("All images have been downloaded.");

    await exec(
      `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    );
    console.log("All images have been stitched.");

    await exec(
      `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg -j 2:2:2`,
      { cwd: waifu }
    );
    console.log("All images have been through waifu-2x-caffe.");

    await exec(`C:/7z.exe a public/${chaptername}.7z  ./${waifu_directory}/*`);

    fs.rm(`./${directory}`, { recursive: true });
    fs.rm(`./${waifu_directory}`, { recursive: true });

    console.log("Temp directories are being removed.");

    return `${chaptername}.7z`;
  } catch (error) {
    console.log(error);
    console.log(
      `An error in chapter ${number} has occurred during download/stitching/waifu.`
    );
  }
}

/*
async function handleTicket(seriesId: string, starts_at: number, series_title: string) {
    try {
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
        // await page.waitForNetworkIdle();
        // await page.screenshot({
        //     path: './buypage.png'
        // });

        // await page.evaluate(() => {
        //     var inputs = document.querySelectorAll('input');
        //     inputs[3].click();
        // })
        // await page.screenshot({ path: 'afterevaluate.png' })
        // await page.click('button[type="submit"]');
        // await page.click('button[type="button"].btnBuy');
        // await page.waitForTimeout(5000);
        // await page.click('span.btnBox');
        // await page.waitForNavigation();
        // await page.waitForNetworkIdle();
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

        const downloadChapter = async (productid: string, number: number, starts_at: number, title: string) => {
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
                        if (button) button.click();
                    })
                    let imagefiles = await new_page.evaluate(() =>
                        Array.from(
                            document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                    )
                    const real_number = number + starts_at;
                    console.log(imagefiles)
                    let chapterfile = await handleChapter(imagefiles, real_number.toString(), title);
                    if (chapterfile) chapters.push(chapterfile);
                    await new_page.close();
                } else {
                    console.log('começando a esperar pela q nao precisa de ticket');
                    console.log(new_page.url());
                    await new_page.screenshot({
                        path: `chapter${number}.png`
                    })
                    let imagefiles = await new_page.evaluate(() =>
                        Array.from(
                            document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                    )
                    console.log(imagefiles)
                    const real_number = number + starts_at;
                    let chapterfile = await handleChapter(imagefiles, real_number.toString(), title);
                    if (chapterfile) chapters.push(chapterfile);
                    await new_page.close();
                }
            } catch (error) {
                console.log(error)
            }
        }

        let split_promises = [];
        var size = 3;
        for (var i = 0; i < chapters_ids.length; i += size) {
            split_promises.push(chapters_ids.slice(i, i + size));
        }

        // console.log(split_promises);
        console.log(chapters_ids);
        for (let i = 0; i <= split_promises.length - 1; i++) {
            await Promise.all(split_promises[i].map(({ id, number }) => downloadChapter(id, parseInt(number), starts_at, series_title)));
        }
        console.log(chapters);
        await browser.close();
        return chapters;
    } catch (error) {
        console.log(error);
        return ['./afterlogintrue.png']
    }
}
*/

type SeriesItem = {
  id: string;
  title: string;
};

/*
async function ripLatest(series_array: SeriesItem[]) {
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
        await newPage.setViewport({ width: 1080, height: 1080 });
        await newPage.screenshot({ path: './beforelogin.png' })
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
    await page.close();
    let chapters: string[] = [];

    const handleSeries = async (seriesID: string, browser: Browser, series_name: string) => {
        let series_url = 'https://page.kakao.com/home?seriesId=' + seriesID + '&orderby=desc';
        let buy_url = 'https://page.kakao.com/buy/ticket?seriesId=' + seriesID;
        const new_page = await browser.newPage();
        await new_page.setViewport({ width: 1080, height: 1080 });
        await new_page.goto(buy_url);
        await new_page.waitForNetworkIdle();
        await new_page.click('button[type="submit"]');
        await new_page.click('button[type="button"].btnBuy');
        await new_page.waitForTimeout(2000);
        await new_page.click('span.btnBox');
        await new_page.waitForNetworkIdle();
        await new_page.goto(series_url, { waitUntil: 'networkidle0' });
        await new_page.screenshot({ path: `./series-${seriesID}.png` })
        let chapter_id = await new_page.evaluate(() => {
            let chapterss = Array.from(document.querySelectorAll<Chapter>('li[data-available="true"]'));
            let all: string[] = [];
            chapterss.forEach((chapter) => all.push(chapter.attributes['data-productid'].value));
            return all[0];
        })

        console.log(chapter_id);

        const downloadChapter = async (productid: string, title: string) => {
            try {
                const url = 'https://page.kakao.com/viewer?productId=' + productid;
                await new_page.goto(url, { waitUntil: 'networkidle0' });
                console.log('vou começar a esperar agora')
                await new_page.waitForTimeout(2000);
                const need_ticket = await new_page.evaluate(() => {
                    const button = document.querySelector('div.preventMobileBodyScroll');
                    if (button) return true;
                    else return false;
                })
                if (need_ticket) {
                    console.log('começando a esperar pela que precisa de ticket')
                    await new_page.waitForTimeout(10000);
                    await new_page.evaluate(() => {
                        const button = document.querySelector<HTMLButtonElement>('span.btnBox > span:nth-child(2)');
                        if (button) button.click();
                    })
                    await new_page.screenshot({ path: `chapter-${productid}.jpeg` })
                    await new_page.waitForNetworkIdle({ timeout: 30 * 1000 });
                    await new_page.waitForTimeout(10000);
                    await new_page.screenshot({ path: `after-networkidle-${productid}.jpeg` })
                    let real_number = await new_page.evaluate(() => {
                        const title = document.querySelector<HTMLDivElement>('div.titleWrap');
                        if (title) {
                            return title.innerText.slice(-4).replaceAll(/\D/g, "");
                        }
                        else return 'latest';
                    })
                    let imagefiles = await new_page.evaluate(() => {
                        const array = Array.from(document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                        return array;
                    }
                    )
                    console.log(imagefiles)
                    if (imagefiles) {
                        let chapterfile = await handleChapter(imagefiles, real_number, title);
                        if (chapterfile) chapters.push(chapterfile);
                    } else chapters.push(`./chapter-${productid}.jpeg`);
                    await new_page.close();
                } else {
                    console.log('começando a esperar pela q nao precisa de ticket');
                    await new_page.screenshot({ path: `chapter-${productid}.jpeg` })
                    console.log(new_page.url());
                    await new_page.waitForTimeout(10000);
                    let real_number = await new_page.evaluate(() => {
                        const title = document.querySelector<HTMLDivElement>('div.titleWrap');
                        if (title) {
                            return title.innerText.slice(-4).replaceAll(/\D/g, "");
                        }
                        else return 'latest';
                    })
                    await new_page.screenshot({
                        path: `chapter${productid}.jpeg`
                    })
                    let imagefiles = await new_page.evaluate(() => {
                        const array = Array.from(document.querySelectorAll<HTMLImageElement>('img.comic-viewer-content-img'), img => img.src)
                        return array;
                    }
                    )
                    console.log(imagefiles)
                    if (imagefiles) {
                        let chapterfile = await handleChapter(imagefiles, real_number, title);
                        if (chapterfile) chapters.push(chapterfile);
                    }
                    else chapters.push(`./chapter-${productid}.jpeg`);
                    await new_page.close();
                }
            } catch (error) {
                console.log(error)
                chapters.push(`./chapter-${productid}.jpeg`);
            }
        }

        await downloadChapter(chapter_id, series_name);

    }


    let split_promises = [];
    var size = 1;
    for (var i = 0; i < series_array.length; i += size) {
        split_promises.push(series_array.slice(i, i + size));
    }

    console.log(series_array);
    for (let i = 0; i <= split_promises.length - 1; i++) {
        await Promise.all(split_promises[i].map(({ id, title }) => handleSeries(id, browser, title)));
    }
    console.log(chapters);
    await browser.close();
    return chapters;
}
*/

type kakaoChapter = {
  id: number;
  title: string;
  price: number;
  video_grade: number;
  age_grade: number;
};

type chapter = {
  id: number;
  title: string;
  free: boolean;
  chapter_number: number;
  series_id: string;
  age_15: boolean;
};

export async function getLatestChapter(
  series_id: string,
  series_title: string,
  browser: Browser
): Promise<string | undefined> {
  try {
    console.log(
      `Starting the weekly RP of the series of the series ${series_title} - ID: ${series_id}`
    );
    const chapters = await getChaptersList(series_id, "desc");
    const chapter = chapters[0];
    if (chapter) {
      const chapter_file = await downloadChapter(
        chapter,
        series_title,
        browser
      );
      return chapter_file;
    }
  } catch (error) {
    console.log("There was an error during the RP process.");
    return "./afterrp.png";
  }
}

export async function getChaptersList(
  seriesid: string | number,
  order: string
): Promise<chapter[]> {
  if (order == "asc" || order == "desc") {
    const response = await axios.post(
      "https://api2-page.kakao.com/api/v5/store/singles",
      `seriesid=${seriesid}&page=0&direction=${order}&page_size=2000&without_hidden=false`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (response.data.singles) {
      const kakao_chapters = response.data.singles;
      const chapters = kakao_chapters
        .map((chapter: kakaoChapter) => {
          if (chapter.video_grade < 0 && chapter.title.includes("화")) {
            let true_number: string | number | undefined = chapter.title
              .split(" ")
              .find((element: string) => element.includes("화"))
              ?.replaceAll(/\D/g, "");
            if (true_number) true_number = parseInt(true_number);
            return {
              id: chapter.id,
              title: chapter.title,
              free: chapter.price > 0 ? false : true,
              chapter_number: true_number
                ? true_number
                : chapter.title.replaceAll(/\D/g, ""),
              series_id: seriesid,
              age_15: chapter.age_grade == 0 ? false : true,
            };
          }
        })
        .filter((element: any) => element !== undefined);
      return chapters;
    }
  } else return [];
  return [];
}

export async function getChapter(
  chapter_number: number,
  series_id: string,
  series_title: string
) {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("starting to get chapters list");
    const chapters = await getChaptersList(series_id, "desc");
    console.log(chapters);
    const chapter = chapters.find(
      (chapter) => chapter.chapter_number == chapter_number
    );
    console.log(chapter);
    if (chapter) {
      if (chapter.free == true && chapter.age_15 == false) {
        const chapter_file = await downloadChapter(
          chapter,
          series_title,
          browser
        );
        await browser.close();
        return chapter_file;
      } else if (chapter.free === true && chapter.age_15 == true) {
        await logIn(browser);
        const chapter_file = await downloadChapter(
          chapter,
          series_title,
          browser
        );
        await browser.close();
        return chapter_file;
      } else {
        await logIn(browser);
        console.log("cheguei aqui");
        const chapter_file = await downloadChapter(
          chapter,
          series_title,
          browser
        );
        await browser.close();
        return chapter_file;
      }
    } else {
      await browser.close();
      return "./afterlogin.png";
    }
  } catch (error) {
    console.log(error);
    return "./afterlogin.png";
  }
}

export async function downloadChapter(
  chapter: chapter,
  series_title: string,
  browser: Browser
) {
  try {
    if (chapter.free === true && chapter.age_15 == false) {
      const response = await axios.post(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
        `productId=${chapter.id}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      const kakao_files = response.data.downloadData.members.files;
      const files_url = kakao_files.map(
        (file: any) =>
          `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
      );
      const chapter_file = await handleChapter(
        files_url,
        chapter.chapter_number.toString(),
        series_title,
        ""
      );
      if (chapter_file) return chapter_file;
    } else if (chapter.free === true && chapter.age_15 == true) {
      const new_page = await browser.newPage();
      await new_page.goto(
        `https://page.kakao.com/viewer?productId=${chapter.id}`,
        { waitUntil: "domcontentloaded" }
      );
      const response = await new_page.waitForResponse(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web"
      );
      const kakao_response = await response.json();
      const kakao_files = kakao_response.downloadData.members.files;
      const files_url = kakao_files.map(
        (file: any) =>
          `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
      );
      const cookies = await new_page.cookies();
      const new_cookies = cookies.map((item) => `${item.name}=${item.value};`);
      const filtered_cookies = new_cookies.join(" ");
      const file_to_be_returned = await handleChapter(
        files_url,
        chapter.chapter_number.toString(),
        series_title,
        filtered_cookies
      );
      await new_page.close();
      return file_to_be_returned;
    } else {
      //await buyTicket(browser, chapter.series_id);
      const new_page = await browser.newPage();
      await new_page.goto(
        `https://page.kakao.com/viewer?productId=${chapter.id}`,
        { waitUntil: "domcontentloaded" }
      );
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 5 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        return file_to_be_returned;
      } catch (error) {
        console.log("first try didnt go well");
      }
      await new_page.waitForNetworkIdle();
      const need_ticket = await new_page.evaluate(() => {
        const button = document.querySelector("div.preventMobileBodyScroll");
        if (button) return true;
        else return false;
      });
      await new_page.screenshot({ path: "./ticket.png" });
      console.log(need_ticket);
      if (need_ticket) {
        await new_page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>(
            "span.btnBox > span:nth-child(2)"
          );
          if (button) button.click();
        });
      }
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 10 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        await new_page.close();
        return file_to_be_returned;
      } catch (error) {
        console.log("second try didnt go well");
      }
      const need_ticket_again = await new_page.evaluate(() => {
        const button = document.querySelector("div.preventMobileBodyScroll");
        if (button) return true;
        else return false;
      });
      if (need_ticket_again) {
        await new_page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>(
            "span.btnBox > span:nth-child(2)"
          );
          if (button) button.click();
        });
      }
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 10 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        await new_page.close();
        return file_to_be_returned;
      } catch (error) {
        console.log("third try didnt go well");
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export async function downloadSRChapter(
  chapter: chapter,
  series_title: string,
  browser: Browser
) {
  try {
    if (chapter.free === true && chapter.age_15 == false) {
      const response = await axios.post(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
        `productId=${chapter.id}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      const kakao_files = response.data.downloadData.members.files;
      const files_url = kakao_files.map(
        (file: any) =>
          `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
      );
      const chapter_file = await handleChapter(
        files_url,
        chapter.chapter_number.toString(),
        series_title,
        ""
      );
      if (chapter_file) return chapter_file;
    } else if (chapter.free === true && chapter.age_15 == true) {
      const new_page = await browser.newPage();
      await new_page.goto(
        `https://page.kakao.com/viewer?productId=${chapter.id}`,
        { waitUntil: "domcontentloaded" }
      );
      const response = await new_page.waitForResponse(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web"
      );
      const kakao_response = await response.json();
      const kakao_files = kakao_response.downloadData.members.files;
      const files_url = kakao_files.map(
        (file: any) =>
          `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
      );
      const cookies = await new_page.cookies();
      const new_cookies = cookies.map((item) => `${item.name}=${item.value};`);
      const filtered_cookies = new_cookies.join(" ");
      const file_to_be_returned = await handleChapter(
        files_url,
        chapter.chapter_number.toString(),
        series_title,
        filtered_cookies
      );
      await new_page.close();
      return file_to_be_returned;
    } else {
      const new_page = await browser.newPage();
      await new_page.goto(
        `https://page.kakao.com/viewer?productId=${chapter.id}`,
        { waitUntil: "domcontentloaded" }
      );
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 5 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        return file_to_be_returned;
      } catch (error) {
        console.log("first try didnt go well");
      }
      await new_page.waitForNetworkIdle();
      const need_ticket = await new_page.evaluate(() => {
        const button = document.querySelector("div.preventMobileBodyScroll");
        if (button) return true;
        else return false;
      });
      await new_page.screenshot({ path: "./ticket.png" });
      console.log(need_ticket);
      if (need_ticket) {
        await new_page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>(
            "span.btnBox > span:nth-child(2)"
          );
          if (button) button.click();
        });
      }
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 10 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        await new_page.close();
        return file_to_be_returned;
      } catch (error) {
        console.log("second try didnt go well");
      }
      const need_ticket_again = await new_page.evaluate(() => {
        const button = document.querySelector("div.preventMobileBodyScroll");
        if (button) return true;
        else return false;
      });
      if (need_ticket_again) {
        await new_page.evaluate(() => {
          const button = document.querySelector<HTMLButtonElement>(
            "span.btnBox > span:nth-child(2)"
          );
          if (button) button.click();
        });
      }
      try {
        const response = await new_page.waitForResponse(
          "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
          { timeout: 10 * 1000 }
        );
        const kakao_response = await response.json();
        const kakao_files = kakao_response.downloadData.members.files;
        console.log(kakao_files);
        const files_url = kakao_files.map(
          (file: any) =>
            `https://page-edge.kakao.com/sdownload/resource?kid=${file.secureUrl}`
        );
        const cookies = await new_page.cookies();
        const new_cookies = cookies.map(
          (item) => `${item.name}=${item.value};`
        );
        const filtered_cookies = new_cookies.join(" ");
        const file_to_be_returned = await handleChapter(
          files_url,
          chapter.chapter_number.toString(),
          series_title,
          filtered_cookies
        );
        await new_page.screenshot({ path: "./afterrp.png" });
        console.log(file_to_be_returned);
        await new_page.close();
        return file_to_be_returned;
      } catch (error) {
        console.log("third try didnt go well");
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export async function processNaver(url: string, channel_name: string) {
  try {
    const directory = randomstring.generate();
    const array_of_variables = url.split("/");
    const filename = array_of_variables[array_of_variables.length - 1];
    const downloadd = new downloader({
      url,
      directory: `${directory}`,
      fileName: `${filename}`,
    });
    console.log(url);
    if (url.includes("discord")) {
      await downloadd.download();
      const files = await fs.readdir(`./${directory}`);
      const name = files[0].split(".")[0] + channel_name;
      const ext = files[0].split(".")[1];
      if (ext == "rar") {
        await exec(`C:/Rar.exe e "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(`C:/7z.exe a public/${name}.7z  ./${directory}/${name}/*`);
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${name}.7z`;
      } else {
        await exec(`C:/7z.exe x "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(`C:/7z.exe a public/${name}.7z  ./${directory}/${name}/*`);
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${name}.7z`;
      }
    } else if (url.includes("drive.google")) {
      const file_id = url
        .replaceAll("https://drive.google.com/file/d/", "")
        .replaceAll("/view?usp=sharing", "")
        .replaceAll("/view?usp=drivesdk", "")
        .replaceAll("/view", "");
      const file_url = `https://drive.google.com/uc?export=download&id=${file_id}&confirm=t`;
      await download(file_url, `./${directory}`);
      const files = await fs.readdir(`./${directory}`);
      const name = files[0].split(".")[0] + channel_name;
      const ext = files[0].split(".")[1];
      const true_name = Handler.toUrl(name);
      if (ext == "rar") {
        await exec(`C:/Rar.exe e "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(
          `C:/7z.exe a public/${true_name}.7z  "./${directory}/${name}/*"`
        );
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${true_name}.7z`;
      } else {
        await exec(`C:/7z.exe x "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(
          `C:/7z.exe a public/${true_name}.7z  "./${directory}/${name}/*"`
        );
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${true_name}.7z`;
      }
    } else if (url.includes("mediafire")) {
      console.log("initializing mediafire");
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const mediafire_page = await browser.newPage();
      await mediafire_page.goto(url);
      const download_link = await mediafire_page.evaluate(() => {
        const url =
          document.querySelector<HTMLAnchorElement>("a#downloadButton");
        if (url) {
          return url.href;
        } else return null;
      });
      console.log(download_link);
      if (download_link) {
        await download(download_link, `./${directory}`);
        const files = await fs.readdir(`./${directory}`);
        const name = files[0].split(".")[0] + channel_name;
        const ext = files[0].split(".")[1];
        if (ext == "rar") {
          await exec(`C:/Rar.exe e "./${files[0]}"`, { cwd: `./${directory}` });
          await fs.unlink(`./${directory}/${files[0]}`);
          await exec(
            `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
          );
          await fs.mkdir(`./${directory}/${name}`, { recursive: true });
          await exec(
            `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
            { cwd: waifu }
          );
          await exec(`C:/7z.exe a public/${name}.7z  ./${directory}/${name}/*`);
          console.log("Chapter processment done.");
          await fs.rm(`./${directory}`, { recursive: true });
          return `${name}.7z`;
        } else {
          await exec(`C:/7z.exe x "./${files[0]}"`, { cwd: `./${directory}` });
          await fs.unlink(`./${directory}/${files[0]}`);
          await exec(
            `python src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
          );
          await fs.mkdir(`./${directory}/${name}`, { recursive: true });
          await exec(
            `C:/waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
            { cwd: waifu }
          );
          await exec(`C:/7z.exe a public/${name}.7z  ./${directory}/${name}/*`);
          console.log("Chapter processment done.");
          await fs.rm(`./${directory}`, { recursive: true });
          return `${name}.7z`;
        }
      } else return null;
    } else {
      return null;
    }
  } catch (e) {
    console.log(e);
    return null;
  }
}

function getGQLQuery_Ticket(seriesId: number | string) {
  return {
    operationName: "contentMyTicket",
    query:
      "query contentMyTicket($seriesId: Long!, $includeSingle: Boolean, $includeWaitfree: Boolean, $onlyPaidTicket: Boolean) { \n  contentMyTicket(\n    seriesId: $seriesId\n    includeSingle: $includeSingle\n    includeWaitfree: $includeWaitfree\n    onlyPaidTicket: $onlyPaidTicket\n) { \n    notOwnCount\n    notReadCount\n    ticketOwnCount\n    ticketRentalCount\n    waitfree { \n      activation\n      chargedAt\n      chargedComplete\n      waitfreePlusProvision { \n        chargedAt\n        chargedTicketCount\n        nextChargeAt\n        nextChargeTicketCount\n        remainTicketCount\n        usedTicketCount\n        __typename\n } \n      __typename\n } \n    __typename\n } \n } \n",
    variables: {
      seriesId,
      includeSingle: false,
      onlyPaidTicket: false,
      includeWaitfree: true,
    },
  };
}

function getGQLQuery_Content(
  seriesId: number | string,
  productId: number | string
) {
  return {
    operationName: "viewerInfo",
    query:
      "query viewerInfo($seriesId: Long!, $productId: Long!) {\n  viewerInfo(seriesId: $seriesId, productId: $productId) {\n    item {\n      ...SingleFragment\n      __typename\n    }\n    seriesItem {\n      ...SeriesFragment\n      __typename\n    }\n    prevItem {\n      ...NearItemFragment\n      __typename\n    }\n    nextItem {\n      ...NearItemFragment\n      __typename\n    }\n    viewerData {\n      ...TextViewerData\n      ...TalkViewerData\n      ...ImageViewerData\n      ...VodViewerData\n      __typename\n    }\n    displayAd {\n      ...DisplayAd\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SingleFragment on Single {\n  id\n  productId\n  seriesId\n  title\n  thumbnail\n  badge\n  isFree\n  ageGrade\n  state\n  slideType\n  lastReleasedDate\n  size\n  pageCount\n  isHidden\n  freeChangeDate\n  isWaitfreeBlocked\n  saleState\n  series {\n    ...SeriesFragment\n    __typename\n  }\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment SeriesFragment on Series {\n  id\n  seriesId\n  title\n  thumbnail\n  categoryUid\n  category\n  subcategoryUid\n  subcategory\n  badge\n  isAllFree\n  isWaitfree\n  isWaitfreePlus\n  ageGrade\n  state\n  onIssue\n  seriesType\n  businessModel\n  authors\n  pubPeriod\n  freeSlideCount\n  lastSlideAddedDate\n  waitfreeBlockCount\n  waitfreePeriodByMinute\n  bm\n  saleState\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment ServicePropertyFragment on ServiceProperty {\n  viewCount\n  readCount\n  ratingCount\n  ratingSum\n  commentCount\n  pageContinue {\n    ...ContinueInfoFragment\n    __typename\n  }\n  todayGift {\n    ...TodayGift\n    __typename\n  }\n  waitfreeTicket {\n    ...WaitfreeTicketFragment\n    __typename\n  }\n  isAlarmOn\n  isLikeOn\n  ticketCount\n  purchasedDate\n  lastViewInfo {\n    ...LastViewInfoFragment\n    __typename\n  }\n  purchaseInfo {\n    ...PurchaseInfoFragment\n    __typename\n  }\n}\n\nfragment ContinueInfoFragment on ContinueInfo {\n  title\n  isFree\n  productId\n  lastReadProductId\n  scheme\n  continueProductType\n}\n\nfragment TodayGift on TodayGift {\n  id\n  uid\n  ticketType\n  ticketKind\n  ticketCount\n  ticketExpireAt\n  isReceived\n}\n\nfragment WaitfreeTicketFragment on WaitfreeTicket {\n  chargedPeriod\n  chargedCount\n  chargedAt\n}\n\nfragment LastViewInfoFragment on LastViewInfo {\n  isDone\n  lastViewDate\n  rate\n  spineIndex\n}\n\nfragment PurchaseInfoFragment on PurchaseInfo {\n  purchaseType\n  rentExpireDate\n}\n\nfragment OperatorPropertyFragment on OperatorProperty {\n  thumbnail\n  copy\n  torosImpId\n  torosFileHashKey\n  isTextViewer\n}\n\nfragment AssetPropertyFragment on AssetProperty {\n  bannerImage\n  cardImage\n  cardTextImage\n  cleanImage\n  ipxVideo\n}\n\nfragment NearItemFragment on NearItem {\n  productId\n  slideType\n  ageGrade\n  isFree\n  title\n  thumbnail\n}\n\nfragment TextViewerData on TextViewerData {\n  type\n  atsServerUrl\n  metaSecureUrl\n  contentsList {\n    chapterId\n    contentId\n    secureUrl\n    __typename\n  }\n}\n\nfragment TalkViewerData on TalkViewerData {\n  type\n  talkDownloadData {\n    dec\n    host\n    path\n    talkViewerType\n    __typename\n  }\n}\n\nfragment ImageViewerData on ImageViewerData {\n  type\n  imageDownloadData {\n    ...ImageDownloadData\n    __typename\n  }\n}\n\nfragment ImageDownloadData on ImageDownloadData {\n  files {\n    ...ImageDownloadFile\n    __typename\n  }\n  totalCount\n  totalSize\n  viewDirection\n  gapBetweenImages\n  readType\n}\n\nfragment ImageDownloadFile on ImageDownloadFile {\n  no\n  size\n  secureUrl\n  width\n  height\n}\n\nfragment VodViewerData on VodViewerData {\n  type\n  vodDownloadData {\n    contentId\n    drmType\n    endpointUrl\n    width\n    height\n    duration\n    __typename\n  }\n}\n\nfragment DisplayAd on DisplayAd {\n  sectionUid\n  bannerUid\n  treviUid\n  momentUid\n}\n",
    variables: {
      seriesId,
      productId,
    },
  };
}

function getGQLQuery_useTicket(productId: number | string) {
  return {
    operationName: "UseTicket",
    query:
      "mutation UseTicket($input: TicketUseMutationInput!) {\n  useTicket(input: $input) {\n    waitfreeChargedAt\n    __typename\n  }\n}\n",
    variables: {
      input: {
        ticketType: "RentPackage",
        productId,
      },
    },
  };
}

function getGQLQuery_buyTicket(seriesId: number | string) {
  return {
    operationName: "buyTicket",
    query:
      "mutation buyTicket($input: TicketBuyMutationInput!) {\n  buyTicket(input: $input) {\n    remainCash\n    purchasedTicketCount\n    __typename\n  }\n}\n",
    variables: {
      input: {
        seriesId,
        ticketKind: "Rent",
        ticketList: [{ ticketId: `TKT020000000${seriesId}001`, quantity: 1 }],
      },
    },
  };
}

function getGQLQuery_readyToUseTicket(
  seriesId: number | string,
  productId: string | number
) {
  return {
    operationName: "readyToUseTicket",
    query:
      "query readyToUseTicket($seriesId: Long!, $productId: Long!, $queryFrom: QueryFromPage!, $nonstopWatching: Boolean!, $pickExactly: Boolean!, $slideType: SlideType, $isFree: Boolean) {\n  readyToUseTicket(\n    seriesId: $seriesId\n    productId: $productId\n    from: $queryFrom\n    nonstopWatching: $nonstopWatching\n    pickExactly: $pickExactly\n    slideType: $slideType\n    isFree: $isFree\n  ) {\n    process\n    nextProcess\n    series {\n      isWaitfree\n      isWaitfreePlus\n      waitfreeBlockCount\n      __typename\n    }\n    single {\n      readAccessType\n      title\n      waitfreeBlock\n      isDone\n      __typename\n    }\n    my {\n      cashAmount\n      ticketOwnCount\n      ticketRentalCount\n      __typename\n    }\n    available {\n      ticketOwnType\n      ticketRentalType\n      __typename\n    }\n    purchase {\n      ticketRental {\n        ticketId\n        ticketType\n        ticketKind\n        price\n        __typename\n      }\n      ticketOwn {\n        ticketId\n        ticketType\n        ticketKind\n        price\n        __typename\n      }\n      __typename\n    }\n    nextItem {\n      productId\n      isFree\n      slideType\n      ageGrade\n      __typename\n    }\n    __typename\n  }\n}\n",
    variables: {
      isFree: false,
      nonstopWatching: false,
      pickExactly: false,
      productId,
      queryFrom: "ContentHome",
      seriesId,
      slideType: "Comic",
    },
  };
}

function getGQLQuery_buyAndUseTicket(
  productId: number | string,
  seriesId: string | number
) {
  return {
    operationName: "BuyAndUseTicket",
    query:
      "mutation BuyAndUseTicket($input: TicketBuyAndUseMutationInput!) {\n  buyAndUseTicket(input: $input) {\n    buyTicketinfo\n    remainCash\n    __typename\n  }\n}\n",
    variables: {
      input: {
        productId,
        ticketId: `TKT020000000${seriesId}001`,
      },
    },
  };
}

function getGQLQuery_getDevicesList() {
  return {
    operationName: "deviceInfo",
    query:
      "query deviceInfo {\n  deviceInfo {\n    deviceList {\n      ...Device\n      __typename\n    }\n    deviceReplaceableCount\n    deviceLimitCount\n    __typename\n  }\n}\n\nfragment Device on Device {\n  deviceUid\n  deviceModel\n  isCurrentDevice\n  lastUsedDt\n  createdDt\n}\n",
    variables: {},
  };
}

async function getDeviceCookie(auth_cookies: string) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_getDevicesList(),
    {
      headers: {
        Cookie: auth_cookies,
      },
    }
  );
  return `_kpdid=${response.data.data.deviceInfo.deviceList[0].deviceUid};`;
}

async function getTickets(seriesId: string | number, cookies: string) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_Ticket(seriesId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  console.log(response.data);
  return {
    tickets: response.data.data.contentMyTicket.ticketRentalCount,
    status: response.status,
  };
}

async function buyTicket(seriesId: number | string, cookies: string) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_buyTicket(seriesId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  return {
    status: response.status,
  };
}

async function useTicket(productId: number | string, cookies: string) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_useTicket(productId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  return {
    status: response.status,
    data: response.data,
  };
}

async function buyAndUseTicket(
  productId: number | string,
  seriesId: string | number,
  cookies: string
) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_buyAndUseTicket(productId, seriesId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  console.log("response from buy and use ticket", response.data);
  return {
    status: response.status,
    data: response.data,
  };
}

async function readyToUseTicket(
  productId: number | string,
  seriesId: number | string,
  cookies: string
) {
  console.log(getGQLQuery_readyToUseTicket(seriesId, productId));
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_readyToUseTicket(seriesId, productId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  console.log("response from ready to use ticket", response.data);
  return {
    status: response.status,
    data: response.data,
  };
}

async function getChapterContent(
  seriesId: number | string,
  productId: number | string,
  cookies: string
) {
  const response = await axios.post(
    "https://page.kakao.com/graphql",
    getGQLQuery_Content(seriesId, productId),
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  console.log(response.data);
  return {
    status: response.status,
    files: response.data.data.viewerInfo.viewerData.imageDownloadData.files.map(
      (file: any) => file.secureUrl
    ),
  };
}

async function getSpecificChapter(
  seriesId: string | number,
  chapter_number: string | number,
  title: string | number
) {
  try {
    const cookies = require("../../config.json").cookies;
    console.log(cookies);
    const chapters = await getChaptersList(seriesId, "desc");
    console.log(chapters);
    console.log(seriesId, chapter_number, title);
    const chapter = chapters.find(
      (chapter) => chapter.chapter_number == chapter_number
    );
    if (chapter) {
      try {
        const content_chapter = await getChapterContent(
          seriesId,
          chapter.id,
          cookies
        );
        const chapter_file = await handleChapter(
          content_chapter.files,
          chapter.chapter_number.toString(),
          title.toString(),
          cookies
        );
        return chapter_file;
      } catch (error) {
        const tickets = await getTickets(seriesId, cookies);
        if (!tickets) return;
        if (tickets.tickets == 0) {
          await buyTicket(seriesId, cookies);
        } else {
          const useTicket_data = await useTicket(chapter.id, cookies);
          if (
            useTicket_data.data.errors &&
            useTicket_data.data.errors.length > 0
          ) {
            await readyToUseTicket(chapter.id, seriesId, cookies);
            await buyAndUseTicket(chapter.id, seriesId, cookies);
          }
          const content = await getChapterContent(
            seriesId,
            chapter.id,
            cookies
          );
          if (content.files) {
            const chapter_file = await handleChapter(
              content.files,
              chapter.chapter_number.toString(),
              title.toString(),
              cookies
            );
            return chapter_file;
          }
        }
      }
    }
  } catch (error: any) {
    console.log(error);
    console.log(error.data);
  }
}

export { handleChapter, getSpecificChapter };
