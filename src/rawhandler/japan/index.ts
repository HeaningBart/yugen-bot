import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
const {
  jp_login,
  jp_pwd,
  vpn_user,
  vpn_password,
  vpn_url,
} = require("../../../config.json");
import downloader from "nodejs-file-downloader";
import util from "util";
const exec = util.promisify(require("child_process").exec);
import fs from "fs/promises";
import { waifu } from "../index";

export async function start() {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      `--proxy-server=https://jp547.nordvpn.com:89`,
    ]
  });

  return browser;
}

const get_checksum = (img_url: string) => {
  const split_url = img_url.split("/");
  return split_url[split_url.length - 2];
};

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
  console.log("eu estou aqui");
  await page.authenticate({
    username: vpn_user,
    password: vpn_password,
  });
  await page.goto("https://piccoma.com/web/acc/email/signin", { timeout: 0 });
  await page.type('input[name="email"]', jp_login);
  await page.type('input[name="password"]', jp_pwd);
  await page.evaluate(() => {
    var form = document.querySelector("form");
    if (form) {
      form.submit();
    }
  });
  await page.waitForTimeout(5000);
  await page.close();
}

export async function getLatestChapter(
  series_id: string | number,
  series_name: string,
  browser: Browser
) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(
    `https://piccoma.com/web/product/${series_id}/episodes?etype=E`,
    { timeout: 0, waitUntil: "networkidle0" }
  );
  const chapter_id = await page.evaluate(() => {
    const chapters = document.querySelectorAll(`a[data-user_access="require"]`);
    const id = chapters[chapters.length - 1].getAttribute("data-episode_id");
    return id;
  });
  await page.click(`a[data-episode_id="${chapter_id}"]`);

  await page.waitForTimeout(5000);

  try {
    await page.click("div.jconfirm-buttons > button", {
      delay: 5000,
      clickCount: 20,
    });
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('div.jconfirm-buttons > button');
      if (button) {
        button.click();
      }
    })
  } catch (error) {
    console.log(error);
  }

  await page.waitForTimeout(15000);

  const chapter_data = await page.evaluate(() => {
    //@ts-ignore
    const data = _pdata_;
    return data;
  });

  console.log('this is pdata' + chapter_data);

  var img_data = chapter_data.img.map((item: any) => item.path);
  const chapter_title = chapter_data.title.replaceAll(/\D/g, "") + `-${chapter_data.episode_id}`;
  const directory = `chapter-${chapter_title}-${series_name}`;
  const waifu_directory = `waifu-${chapter_title}-${series_name}`;

  img_data = img_data.filter(
    (item: any) => item !== null && typeof item !== undefined && item !== ""
  );

  const img_array = img_data.map(
    (item: any, index: any) =>
      new downloader({
        url: "https://" + item,
        directory: `./${directory}`,
        fileName: `${index}.jpg`,
      })
  );

  const expires_array = img_data.map((item: any) => {
    const x = new URLSearchParams(item);
    return x.get("expires");
  });


  const functio = (checksum: string, expires: string) => {
    const key = expires;

    for (let i = 0; i <= key.length - 1; i++) {
      if (key[i] !== '0') {
        checksum =
          checksum.slice(-key[i]) +
          checksum.slice(0, checksum.length - parseInt(key[i]));
      }
    }

    return checksum;

  }

  const seeds_array = img_data.map((item: any, index: any) => {
    const seed = functio(get_checksum(item), expires_array[index]);
    return seed;
  });

  try {
    await Promise.all(img_array.map((item: any) => item.download()));
    console.log("All images have been downloaded.");
  } catch (error) {
    console.log("There was an error downloading images: " + error);
  }

  for (let i = 0; i <= img_data.length - 1; i++) {
    try {
      await exec(
        `pycasso ${directory}/${i}.jpg ${directory}/output/${i} scramble -n 50 50 -s ${seeds_array[i]} -f jpeg`
      );
    } catch (error) {
    }
  }

  try {
    await fs.mkdir(waifu_directory, { recursive: true });
    await exec(
      `python3 src/rawhandler/SmartStitchConsole.py -i "${directory}/output" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    );
    console.log("All images have been stitched.");

    await exec(
      `./waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/output/Stitched -f jpg -j 2:2:2`,
      { cwd: waifu }
    );
    console.log("All images have been through waifu-2x-caffe.");

    await exec(`7z a public/${directory}.7z  ./${waifu_directory}/*`);

    fs.rm(`./${directory}`, { recursive: true });
    fs.rm(`./${waifu_directory}`, { recursive: true });

    console.log("Temp directories are being removed.");

    return `${directory}.7z`;
  } catch (error) { }
}

export async function getListOfChapters(
  number_of_chapters: number,
  series_id: string,
  browser: Browser
) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(
    `https://piccoma.com/web/product/${series_id}/episodes?etype=E`,
    { timeout: 0, waitUntil: "networkidle0" }
  );

  const chapters_ids = await page.evaluate(() => {
    const chapters = Array.from(document.querySelectorAll(`a[data-user_access="require"]`));
    const filtered_chapters = chapters.map((item: any) => {
      return item.getAttribute('data-episode_id');
    })
    return filtered_chapters;
  });

  const selected_chapters = chapters_ids.slice(-number_of_chapters)

  console.log(selected_chapters);

  //   await page.close();

  return selected_chapters;
}

export async function getSpecificChapter(
  series_id: string | number,
  episode_id: string | number,
  series_name: string,
  browser: Browser
) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(
    `https://piccoma.com/web/product/${series_id}/episodes?etype=E`,
    { timeout: 0, waitUntil: "networkidle0" }
  );

  await page.click(`a[data-episode_id="${episode_id}"]`);

  await page.waitForTimeout(5000);

  try {
    await page.click("div.jconfirm-buttons > button", {
      delay: 5000,
      clickCount: 20,
    });
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('div.jconfirm-buttons > button');
      if (button) {
        button.click();
      }
    })
  } catch (error) {
    console.log(error);
  }

  await page.waitForTimeout(15000);

  const chapter_data = await page.evaluate(() => {
    //@ts-ignore
    const data = _pdata_;
    return data;
  });

  var img_data = chapter_data.img.map((item: any) => item.path);
  const chapter_title = chapter_data.title.replaceAll(/\D/g, "") + `-${chapter_data.episode_id}`;
  const directory = `chapter-${chapter_title}-${series_name}`;
  const waifu_directory = `waifu-${chapter_title}-${series_name}`;

  img_data = img_data.filter(
    (item: any) => item !== null && typeof item !== undefined && item !== ""
  );

  const img_array = img_data.map(
    (item: any, index: any) =>
      new downloader({
        url: "https://" + item,
        directory: `./${directory}`,
        fileName: `${index}.jpg`,
      })
  );

  const expires_array = img_data.map((item: any) => {
    const x = new URLSearchParams(item);
    return x.get("expires");
  });

  const functio = (checksum: string, expires: string) => {
    const key = expires;

    for (let i = 0; i <= key.length - 1; i++) {
      if (key[i] !== '0') {
        checksum =
          checksum.slice(-key[i]) +
          checksum.slice(0, checksum.length - parseInt(key[i]));
      }
    }

    return checksum;

  }

  const seeds_array = img_data.map((item: any, index: any) => {
    const seed = functio(get_checksum(item), `${expires_array[index]}`);
    return seed;
  });

  try {
    await Promise.all(img_array.map((item: any) => item.download()));
    console.log("All images have been downloaded.");
  } catch (error) {
    console.log("There was an error downloading images: " + error);
  }

  for (let i = 0; i <= img_data.length - 1; i++) {
    try {
      await exec(
        `pycasso ${directory}/${i}.jpg ${directory}/output/${i} scramble -n 50 50 -s ${seeds_array[i]} -f jpeg`
      );
    } catch (error) { }
  }

  try {
    await fs.mkdir(waifu_directory, { recursive: true });
    await exec(
      `python3 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    );
    console.log("All images have been stitched.");

    await exec(
      `./waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg -j 2:2:2`,
      { cwd: waifu }
    );
    console.log("All images have been through waifu-2x-caffe.");

    await exec(`7z a public/${directory}.7z  ./${waifu_directory}/*`);

    fs.rm(`./${directory}`, { recursive: true });
    fs.rm(`./${waifu_directory}`, { recursive: true });

    console.log("Temp directories are being removed.");

    return `${directory}.7z`;
  } catch (error) { }
}
