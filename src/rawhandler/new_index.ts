import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import download from 'download';
import util from 'util';
const exec = util.promisify(require('child_process').exec);
import fs from 'fs/promises'
import path from 'path';
const { email, password } = require('../../config.json');
import axios from 'axios'
// Relative paths
export const waifu = path.resolve(__dirname);
import randomstring from 'randomstring'
import Handler from '../handlers';
import downloader from 'nodejs-file-downloader'
import { toUrl } from '..';
import { getChaptersList, handleChapter } from '.';
const cookies = '_kptid=5f40e8187bd44dff9e09bab89446e903; _fbp=fb.1.1653830527337.1563394424; __T_=1; TIARA=jg6YuJc1x9AuRsPwRfd3gIxN41qu8g6BEj4TgEsvV-fqbH9NllkasLJAXFOzrYStuZeuKB9TdxJOiap5qLrjljulLfyVWaf7SZvmCOTWKIE0; _kp_collector=KP.1494425122.1655039063075; _kadu=oR0DErKI8bqJjJpQ_1655040999775; JSESSIONID=334C6882C733E19B206C1C8BC62B554F; _kpdid=e228f2c0015441cbbf20bc747720a16d; _kawlt=CJ6a0oz8hP7KhiRNEsY0MKgWwui5J_VOIWD4cHtRBAxm4iNO0pKy1JXQeWEn3UNZ52xYdwcR_TGGz03ac3RjY6qFk8HMD_pESvBs62f4jKeTtalSNmjF4vio-whTcyWi; _kawltea=1664672999; _karmt=nMvkqDvgrsMrVNdhiCunklUGD12sHMmE6IVSzxdjqGcAJ7y59pNurPC9tKBFQB30; _karmtea=1664683799; _kahai=6148d8c50e20a4443827c2cc0e240746772e2d2f0bc2dd8c0554c0dc8d9ecb20; _kpawbat=6853ldLePIMKsFyygoCVRryPztFWP1GBQmfVe4MVCinJXwAAAYORvKyv; _kpwtkn=U2FsdGVkX187iWL9tdZKtBdGCiABTOrs1YT7yQeRk8WOtKh7oq4%2Fg7pqeGJXkrG5IZ%2FFf4Xm8zaZdGf42NHL7NzYY0JSdN04L6x7X7LuwESE3Uvo5d9Hcc%2BejxVOtncr1DuYXdPzvEr9HI%2FT31kMf2qGeoAe4ur%2F5D4zMBKXejA57Aa1FWEnjz9YUJrgvybopt%2Fq0Xm3lNIrDGHWLav54C%2BtPQIHikjeNF2fohhQjv0mAQT%2BQnfsErH8dogOndLO%2Fj0VChxHWjqifCvmAm1PlMRHmlOw0ftSfgL7SXwpNFEEDZzZ5ZFzlxLUi7PZyA3m0ym6KX9eQpabQzP67oJ411%2FUi5LlQA5l9bXCxrdvPW%2FN%2BkSBhw9K3jfPZ8eeGky5GL4OSfk1NzPh7zQI0ijnPh%2BGHM4ProbDne5GVZW9abjW4RpOQo0YooQeF4Nb9nTBTLtjfuqQgDmTLiGsETIu7qExmgAS5pmOTNFskqjnnv0bYdEQAaotU7Uje10VL9wGvjWu0jBKP%2Fh5iLw2VK3jYGi3v0xxpjkYNWmYsjaxz3X46BFyzWeQPcN2aLiKTFP3cVTT1k75n6G2SzmlR2U%2BsLUgmZUeH73haPOLMgxtlbYK3Cr1RSWWbS%2BhnbVhSpl%2BQYE3lr9HgxP2AT7wusjNpgn7UM8l%2BUX%2BDhnUABSphepp%2BoMjTvONEBNF7zf%2F43PjVEmNM1cjqCUyxSxo%2BS%2BqS3%2FvnnwuwieTjYP3Py1cf6kGQNwTMhWuURfFiws8g6pnUrLkPcy9m%2FCzo5qyrawf29rNeIOdcTGs8t97gpdyTHf5qKdpVjnlMMMcZRW0aD2SrO5Iw%2BzBpZ22T0Gx1B0jC5FQCIwU8%2Ff8szAJ9EjeaZ67P7aUTCRH5mha99mY6GAlPgUNOOJezl8B3EhaHEh8ygulcXsF3T3c2sc%2BvW%2FHn%2FqC5iGN5imWkXAZ37OWM7I741thieTXUF%2BdJi9pLVgpLxDDkPF6buta1ltKEL5GoVnHLJbbq6sqEMG3An8LmqBU0ZFEGYAEAxdKrxF4K7eRG6MK4h%2FdWM9xBK%2FDcgWx%2BDvU2sEJPYGoRqZD6IdSgRBq; _kpw_katkn=eyJhbGciOiJFUzI1NiJ9.eyJhY2Nlc3NUb2tlbiI6IjY4NTNsZExlUElNS3NGeXlnb0NWUnJ5UHp0RldQMUdCUW1mVmU0TVZDaW5KWHdBQUFZT1J2S3l2IiwiYXBwVXNlcklkIjoxNzI4MzM1OTA1LCJyZWZyZXNoVG9rZW5FeHBpcmVEYXRlIjoiMjAyMi0xMS0zMFQwNDoxMDowNy44MTRaIiwicHJvY2Vzc0luU2lnblVwIjpmYWxzZSwiaWF0IjoxNjY0NTk3NDEyLCJpc3MiOiJ1cm46cGFnZS5rYWthby5jb206aXNzdWVyIiwiYXVkIjoidXJuOnBhZ2VzdGFnZS5rYWthby5jb206YXVkaWVuY2UiLCJleHAiOjE2NjQ2MDQ2MTJ9.tBWxvCoboEjbOROiU_w3zpdf3hwfKbO6svZfODZdGzfAI71OSBx9BauDUqvGUyaa5gFHSna9-tKQrMZz61OT_Q; _T_ANO=YeLZ7mq9EWDiWxzKo1bH5ZFH8gfxgRoHhYdWSQQW3y3jrPgGEWEHE5MOMSnv3holi+6RnnDdGKJqNGNQwmuuLqUnY/6Qo3ia/uE/OI868jTvO416TKmZV+xDgCaHIaZXEEeh1er2Fh8HPWDIwULLDex0PluXFUXjr7xa5nvrd/WbWncm9bPxgvayu/fqUaNIi2+CjOYJUIrWGPqdyliH8f9TgH1O5kuENHsG36bqwT/gR6m+BtT+9po71TY+hOnbZtsD0Es8ZYXxakDZ1Tk1aIjiVIIpZoYxIQqGFKuHnUQUEYJzaw/sO+Vl++mbEFm3EWjr//mlLqP4pgwJ8lSFsw=='


function getGQLQuery_Ticket(seriesId: number | string) {
    return {
        operationName: "contentMyTicket",
        query: "query contentMyTicket($seriesId: Long!, $includeSingle: Boolean, $includeWaitfree: Boolean, $onlyPaidTicket: Boolean) { \n  contentMyTicket(\n    seriesId: $seriesId\n    includeSingle: $includeSingle\n    includeWaitfree: $includeWaitfree\n    onlyPaidTicket: $onlyPaidTicket\n) { \n    notOwnCount\n    notReadCount\n    ticketOwnCount\n    ticketRentalCount\n    waitfree { \n      activation\n      chargedAt\n      chargedComplete\n      waitfreePlusProvision { \n        chargedAt\n        chargedTicketCount\n        nextChargeAt\n        nextChargeTicketCount\n        remainTicketCount\n        usedTicketCount\n        __typename\n } \n      __typename\n } \n    __typename\n } \n } \n",
        variables: {
            seriesId,
            includeSingle: false,
            onlyPaidTicket: false,
            includeWaitfree: true
        }
    }
}


function getGQLQuery_Content(seriesId: number | string, productId: number | string) {
    return {
        operationName: "viewerInfo",
        query: "query viewerInfo($seriesId: Long!, $productId: Long!) {\n  viewerInfo(seriesId: $seriesId, productId: $productId) {\n    item {\n      ...SingleFragment\n      __typename\n    }\n    seriesItem {\n      ...SeriesFragment\n      __typename\n    }\n    prevItem {\n      ...NearItemFragment\n      __typename\n    }\n    nextItem {\n      ...NearItemFragment\n      __typename\n    }\n    viewerData {\n      ...TextViewerData\n      ...TalkViewerData\n      ...ImageViewerData\n      ...VodViewerData\n      __typename\n    }\n    displayAd {\n      ...DisplayAd\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment SingleFragment on Single {\n  id\n  productId\n  seriesId\n  title\n  thumbnail\n  badge\n  isFree\n  ageGrade\n  state\n  slideType\n  lastReleasedDate\n  size\n  pageCount\n  isHidden\n  freeChangeDate\n  isWaitfreeBlocked\n  saleState\n  series {\n    ...SeriesFragment\n    __typename\n  }\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment SeriesFragment on Series {\n  id\n  seriesId\n  title\n  thumbnail\n  categoryUid\n  category\n  subcategoryUid\n  subcategory\n  badge\n  isAllFree\n  isWaitfree\n  isWaitfreePlus\n  ageGrade\n  state\n  onIssue\n  seriesType\n  businessModel\n  authors\n  pubPeriod\n  freeSlideCount\n  lastSlideAddedDate\n  waitfreeBlockCount\n  waitfreePeriodByMinute\n  bm\n  saleState\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment ServicePropertyFragment on ServiceProperty {\n  viewCount\n  readCount\n  ratingCount\n  ratingSum\n  commentCount\n  pageContinue {\n    ...ContinueInfoFragment\n    __typename\n  }\n  todayGift {\n    ...TodayGift\n    __typename\n  }\n  waitfreeTicket {\n    ...WaitfreeTicketFragment\n    __typename\n  }\n  isAlarmOn\n  isLikeOn\n  ticketCount\n  purchasedDate\n  lastViewInfo {\n    ...LastViewInfoFragment\n    __typename\n  }\n  purchaseInfo {\n    ...PurchaseInfoFragment\n    __typename\n  }\n}\n\nfragment ContinueInfoFragment on ContinueInfo {\n  title\n  isFree\n  productId\n  lastReadProductId\n  scheme\n  continueProductType\n}\n\nfragment TodayGift on TodayGift {\n  id\n  uid\n  ticketType\n  ticketKind\n  ticketCount\n  ticketExpireAt\n  isReceived\n}\n\nfragment WaitfreeTicketFragment on WaitfreeTicket {\n  chargedPeriod\n  chargedCount\n  chargedAt\n}\n\nfragment LastViewInfoFragment on LastViewInfo {\n  isDone\n  lastViewDate\n  rate\n  spineIndex\n}\n\nfragment PurchaseInfoFragment on PurchaseInfo {\n  purchaseType\n  rentExpireDate\n}\n\nfragment OperatorPropertyFragment on OperatorProperty {\n  thumbnail\n  copy\n  torosImpId\n  torosFileHashKey\n  isTextViewer\n}\n\nfragment AssetPropertyFragment on AssetProperty {\n  bannerImage\n  cardImage\n  cardTextImage\n  cleanImage\n  ipxVideo\n}\n\nfragment NearItemFragment on NearItem {\n  productId\n  slideType\n  ageGrade\n  isFree\n  title\n  thumbnail\n}\n\nfragment TextViewerData on TextViewerData {\n  type\n  atsServerUrl\n  metaSecureUrl\n  contentsList {\n    chapterId\n    contentId\n    secureUrl\n    __typename\n  }\n}\n\nfragment TalkViewerData on TalkViewerData {\n  type\n  talkDownloadData {\n    dec\n    host\n    path\n    talkViewerType\n    __typename\n  }\n}\n\nfragment ImageViewerData on ImageViewerData {\n  type\n  imageDownloadData {\n    ...ImageDownloadData\n    __typename\n  }\n}\n\nfragment ImageDownloadData on ImageDownloadData {\n  files {\n    ...ImageDownloadFile\n    __typename\n  }\n  totalCount\n  totalSize\n  viewDirection\n  gapBetweenImages\n  readType\n}\n\nfragment ImageDownloadFile on ImageDownloadFile {\n  no\n  size\n  secureUrl\n  width\n  height\n}\n\nfragment VodViewerData on VodViewerData {\n  type\n  vodDownloadData {\n    contentId\n    drmType\n    endpointUrl\n    width\n    height\n    duration\n    __typename\n  }\n}\n\nfragment DisplayAd on DisplayAd {\n  sectionUid\n  bannerUid\n  treviUid\n  momentUid\n}\n",
        variables: {
            seriesId,
            productId
        }
    }
}

function getGQLQuery_useTicket(productId: number | string) {
    return {
        operationName: "UseTicket",
        query: "mutation UseTicket($input: TicketUseMutationInput!) {\n  useTicket(input: $input) {\n    waitfreeChargedAt\n    __typename\n  }\n}\n",
        variables: {
            input: {
                ticketType: "RentSingle",
                productId
            }
        }
    }
}

function getGQLQuery_buyTicket(seriesId: number | string) {
    return {
        operationName: "buyTicket",
        query: "mutation buyTicket($input: TicketBuyMutationInput!) {\n  buyTicket(input: $input) {\n    remainCash\n    purchasedTicketCount\n    __typename\n  }\n}\n",
        variables: {
            input: {
                seriesId,
                ticketKind: "Rent",
                ticketList: [{ ticketId: `TKT020000000${seriesId}001`, quantity: 1 }]
            }
        }
    }
}




async function getTickets(seriesId: string | number) {
    const response = await axios.post('https://page.kakao.com/graphql', getGQLQuery_Ticket(seriesId), {
        headers: {
            Cookie: cookies
        }
    })
    console.log(response.data)
    return {
        tickets: response.data.data.contentMyTicket.ticketRentalCount,
        status: response.status
    }
}


async function buyTicket(seriesId: number | string) {
    const response = await axios.post('https://page.kakao.com/graphql', getGQLQuery_buyTicket(seriesId), {
        headers: {
            Cookie: cookies
        }
    })
    return {
        status: response.status
    }
}


async function useTicket(productId: number | string) {
    const response = await axios.post('https://page.kakao.com/graphql', getGQLQuery_useTicket(productId), {
        headers: {
            Cookie: cookies
        }
    })
    return {
        status: response.status
    }
}

async function getChapterContent(seriesId: number | string, productId: number | string) {
    const response = await axios.post('https://page.kakao.com/graphql', getGQLQuery_Content(seriesId, productId), {
        headers: {
            Cookie: cookies
        }
    })
    return {
        status: response.status,
        files: response.data.data.viewerInfo.viewerData.imageDownloadData.files.map((file: any) => file.secureUrl)
    }
}



export async function getChapter(seriesId: string | number, chapter_number: string | number, title: string | number) {
    try {
        title = toUrl(`${title}`);
        const chapters = (await getChaptersList(seriesId, 'desc'));
        const chapter = chapters.find(chapter => chapter.chapter_number == chapter_number);
        if (chapter) {
            const tickets = await getTickets(seriesId);
            if (!tickets) return;
            if (tickets.tickets == 0) {
                await buyTicket(seriesId);
            } else {
                await useTicket(chapter.id);
                const content = await getChapterContent(seriesId, chapter.id);
                if (content.files) {
                    const chapter_file = await handleChapter(content.files, chapter.chapter_number.toString(), title, cookies);
                    return chapter_file;
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

getChapter(58031028, 64, 'ssn');