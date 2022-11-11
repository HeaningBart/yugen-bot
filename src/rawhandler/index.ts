import { Browser } from "puppeteer";
import puppeteer from "puppeteer-extra";
import download from "download";
import util from "util";
const exec = util.promisify(require("child_process").exec);
import fs from "fs/promises";
import path from "path";
const { server_username, server_address } = require("../../config.json");
import axios from "axios";
// Relative paths
export const waifu = path.resolve(__dirname);
import { logIn, start } from "./kakao";
import randomstring from "randomstring";
import Handler from "../handlers";
import downloader from "nodejs-file-downloader";
import Redis from 'ioredis';

const redis = new Redis();




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
      const img_array = images_array.map((item: any, index: number) => new downloader({
        url: item,
        directory: `./${directory}`,
        fileName: `${index}.jpg`,
        timeout: 15000,
        maxAttempts: 5,
        headers: {
          Cookie: cookies
        }
      }))

      await Promise.all(img_array.map((item: any) => item.download()));


      console.log("All images have been downloaded.");
    } catch (error) {
      console.log("There was an error downloading images: " + error);
    }

    await exec(
      `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
    );
    console.log("All images have been stitched.");

    // await exec(
    //   `./waifu2x-ncnn-vulkan -n 3 -s 1 -o ../../${waifu_directory}/ -i ../../${directory}/Stitched -f jpg -j 2:2:2`,
    //   { cwd: waifu }
    // );


    await exec(
      `mv -i ../../${directory}/Stitched/* ../../${waifu_directory}/ `,
      { cwd: waifu }
    );

    console.log("All images have been through waifu-2x-caffe.");

    await exec(`7z a public/${chaptername}.7z  ./${waifu_directory}/*`);

    await exec(`scp ./public/${chaptername}.7z ${server_username}@${server_address}:/home/raws/`)

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



type SeriesItem = {
  id: string;
  title: string;
};


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

export async function getChaptersList(
  seriesid: string | number,
  order: string
): Promise<chapter[]> {
  if (order == "asc" || order == "desc") {
    const response = await axios.post(
      "https://page.kakao.com/graphql",
      {
        "operationName": "contentHomeProductList",
        "query": "query contentHomeProductList($after: String, $before: String, $first: Int, $last: Int, $seriesId: Long!, $boughtOnly: Boolean, $sortType: String) {\n  contentHomeProductList(\n    seriesId: $seriesId\n    after: $after\n    before: $before\n    first: $first\n    last: $last\n    boughtOnly: $boughtOnly\n    sortType: $sortType\n  ) {\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n      hasPreviousPage\n      startCursor\n      __typename\n    }\n    selectedSortOption {\n      id\n      name\n      param\n      __typename\n    }\n    sortOptionList {\n      id\n      name\n      param\n      __typename\n    }\n    edges {\n      cursor\n      node {\n        ...SingleListViewItem\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SingleListViewItem on SingleListViewItem {\n  id\n  type\n  thumbnail\n  showPlayerIcon\n  isCheckMode\n  isChecked\n  scheme\n  row1 {\n    badgeList\n    title\n    __typename\n  }\n  row2\n  row3\n  single {\n    productId\n    ageGrade\n    id\n    isFree\n    thumbnail\n    title\n    slideType\n    operatorProperty {\n      isTextViewer\n      __typename\n    }\n    __typename\n  }\n  isViewed\n  purchaseInfoText\n  eventLog {\n    ...EventLogFragment\n    __typename\n  }\n}\n\nfragment EventLogFragment on EventLog {\n  click {\n    layer1\n    layer2\n    setnum\n    ordnum\n    copy\n    imp_id\n    imp_provider\n    __typename\n  }\n  eventMeta {\n    id\n    name\n    subcategory\n    category\n    series\n    provider\n    series_id\n    type\n    __typename\n  }\n  viewimp_contents {\n    type\n    name\n    id\n    imp_area_ordnum\n    imp_id\n    imp_provider\n    imp_type\n    layer1\n    layer2\n    __typename\n  }\n  customProps {\n    landing_path\n    view_type\n    toros_imp_id\n    toros_file_hash_key\n    toros_event_meta_id\n    content_cnt\n    event_series_id\n    event_ticket_type\n    play_url\n    __typename\n  }\n}\n",
        "variables": {
          "seriesId": seriesid,
          "boughtOnly": false,
          "sortType": "desc"
        }

      }
    );
    if (response.data.data.contentHomeProductList.edges) {
      const kakao_chapters = response.data.data.contentHomeProductList.edges;


      const chapters = kakao_chapters.map((kakao_node: any, index: any) => {
        const chapter = kakao_node.node.single;
        if (chapter.slideType === "Comic") {
          let true_number: any = chapter.title
            .split(" ")
            .find((element: string) => element.includes("화"))
            ?.replaceAll(/\D/g, "");
          if (true_number) true_number = parseInt(true_number);
          return {
            id: chapter.productId,
            title: chapter.title,
            free: chapter.isFree,
            chapter_number: true_number
              ? true_number
              : chapter.title.replaceAll(/\D/g, ""),
            series_id: seriesid,
            age_15: chapter.ageGrade == "All" ? false : true,
          };
        }
      }).filter((element: any) => element !== undefined);
      return chapters;
    }
  } else return [];
  return [];
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
        await exec(`rar e "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(`7z a public/${name}.7z  ./${directory}/${name}/*`);
        await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${name}.7z`;
      } else {
        await exec(`7z x "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(`7z a public/${name}.7z  ./${directory}/${name}/*`);
        await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
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
        await exec(`rar e "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(
          `7z a public/${true_name}.7z  "./${directory}/${name}/*"`
        );
        await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
        console.log("Chapter processment done.");
        await fs.rm(`./${directory}`, { recursive: true });
        return `${true_name}.7z`;
      } else {
        await exec(`7z x "./${files[0]}"`, { cwd: `./${directory}` });
        await fs.unlink(`./${directory}/${files[0]}`);
        await exec(
          `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
        );
        await fs.mkdir(`./${directory}/${name}`, { recursive: true });
        await exec(
          `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
          { cwd: waifu }
        );
        await exec(
          `7z a public/${true_name}.7z  "./${directory}/${name}/*"`
        );
        await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
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
          await exec(`rar e "./${files[0]}"`, { cwd: `./${directory}` });
          await fs.unlink(`./${directory}/${files[0]}`);
          await exec(
            `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
          );
          await fs.mkdir(`./${directory}/${name}`, { recursive: true });
          await exec(
            `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
            { cwd: waifu }
          );
          await exec(`7z a public/${name}.7z  ./${directory}/${name}/*`);
          await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
          console.log("Chapter processment done.");
          await fs.rm(`./${directory}`, { recursive: true });
          return `${name}.7z`;
        } else {
          await exec(`7z x "./${files[0]}"`, { cwd: `./${directory}` });
          await fs.unlink(`./${directory}/${files[0]}`);
          await exec(
            `python3.9 src/rawhandler/SmartStitchConsole.py -i "${directory}" -H 12000 -cw 800 -w 2 -t ".jpeg" -s 90`
          );
          await fs.mkdir(`./${directory}/${name}`, { recursive: true });
          await exec(
            `./waifu2x-ncnn-vulkan -n 3 -s 1 -o "../../${directory}/${name}" -i "../../${directory}/Stitched" -f jpg`,
            { cwd: waifu }
          );
          await exec(`7z a public/${name}.7z  ./${directory}/${name}/*`);
          await exec(`scp ./public/${name}.7z ${server_username}@${server_address}:/home/raws/`)
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


async function checkCookiesValidity(cookies: string) {
  try {
    const device = await getDeviceCookie(cookies);
    if (typeof device === 'string') return true;
  } catch (error) {
    return false;
  }
}

async function getSpecificChapter(
  seriesId: string | number,
  chapter_number: string | number,
  title: string | number
) {
  try {

    var cookies = await redis.get('kakao_cookies');

    if (!cookies) {
      const browser = await start();
      cookies = await logIn(browser);
      await browser.close();
      await redis.set('kakao_cookies', cookies, 'EX', 127600);
    }

    const isValid = await checkCookiesValidity(cookies);

    if (!isValid) {
      const browser = await start();
      cookies = await logIn(browser);
      await browser.close();
      await redis.set('kakao_cookies', cookies, 'EX', 127600);
    }

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
        if (tickets.tickets == 0) {
          await buyTicket(seriesId, cookies);
        } else {
          const useTicket_data = await useTicket(chapter.id, cookies);
          if (
            useTicket_data.data.errors &&
            useTicket_data.data.errors.length > 0
          ) {
            try {
              await readyToUseTicket(chapter.id, seriesId, cookies);
              await buyAndUseTicket(chapter.id, seriesId, cookies);
            } catch (error) {
              await buyAndUseTicket(chapter.id, seriesId, cookies);
              console.log(error)
            }
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


async function getLatestChapter(
  seriesId: string | number,
  title: string | number
) {
  try {


    var cookies = await redis.get('kakao_cookies');

    if (!cookies) {
      const browser = await start();
      cookies = await logIn(browser);
      await browser.close();
      await redis.set('kakao_cookies', cookies, 'EX', 127600);
    }

    const isValid = await checkCookiesValidity(cookies);

    if (!isValid) {
      const browser = await start();
      cookies = await logIn(browser);
      await browser.close();
      await redis.set('kakao_cookies', cookies, 'EX', 127600);
    }

    console.log(cookies);
    const chapters = await getChaptersList(seriesId, "desc");
    console.log(chapters);
    const chapter = chapters[0]
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
        if (tickets.tickets == 0) {
          await buyTicket(seriesId, cookies);
        } else {
          const useTicket_data = await useTicket(chapter.id, cookies);
          if (
            useTicket_data.data.errors &&
            useTicket_data.data.errors.length > 0
          ) {
            try {
              await readyToUseTicket(chapter.id, seriesId, cookies);
              await buyAndUseTicket(chapter.id, seriesId, cookies);
            } catch (error) {
              await buyAndUseTicket(chapter.id, seriesId, cookies);
              console.log(error)
            }
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




export { handleChapter, getSpecificChapter, getLatestChapter };
