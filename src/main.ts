import { Boss, CommonInfo, MaintenanceInfo, ServerName } from './boss.models';
import { normalize } from './util';

const BOSS_TYPES = {
  Gormodaf: {
    interval: 8,
    name: 'Gormodaf'
  },
  Gorlon: {
    interval: 6,
    name: 'Gorlon'
  }
};

function main() {
  delTrigger();

  const sheetCommon = getSpreadSheet(ServerName.Common);

  const commonInfo: CommonInfo = {
    maintenance: getMaintenanceTime(sheetCommon)
  };

  const sheetElph = getSpreadSheet(ServerName.Elph);
  if (sheetElph) {
    const elphInfo = createBossInfo(sheetElph, ServerName.Elph, commonInfo);
    scheduling(elphInfo);
  }

  const sheetRose = getSpreadSheet(ServerName.Rose);
  if (sheetRose) {
    const roseInfo = createBossInfo(sheetRose, ServerName.Rose, commonInfo);
    scheduling(roseInfo);
  }

  const sheetMoen = getSpreadSheet(ServerName.Moen);
  if (sheetMoen) {
    const moenInfo = createBossInfo(sheetMoen, ServerName.Moen, commonInfo);
    scheduling(moenInfo);
  }
}

function createBossInfo(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  server: ServerName,
  commonInfo: CommonInfo
) {
  const jitter = getJitter(spreadsheet);
  const gorlon = new Boss(BOSS_TYPES.Gorlon, commonInfo, jitter.gorlon);
  const gormodaf = new Boss(BOSS_TYPES.Gormodaf, commonInfo, jitter.gormodaf);
  // console.log(`gormodaf ${JITTER[ServerName[server]].gormodaf} on ${ServerName[server]}`);
  const spawnTime = getLatestSpawnTime(spreadsheet);

  gorlon.updateLatestSpawnTime(spawnTime.gorlon);
  gormodaf.updateLatestSpawnTime(spawnTime.gormodaf);

  return {
    gormodaf,
    gorlon,
    server
  };
}

// SpreadSheet系操作

function getSpreadSheet(server: ServerName): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
    'SH_ID_' + ServerName[server].toUpperCase()
  );
  if (!spreadsheetId) {
    return undefined;
  }
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet;
}

function getLatestSpawnTime(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('time');
  const spawnTimeList = sheet.getRange(2, 1, 1, 2).getValues();
  const spawnTime = {
    gorlon: normalize(spawnTimeList[0][0]),
    gormodaf: normalize(spawnTimeList[0][1])
  };
  return spawnTime;
}

function getJitter(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('jitter');
  const jitterTimeList = sheet.getRange(2, 1, 1, 2).getValues();
  const jitter = {
    gorlon: jitterTimeList[0][0],
    gormodaf: jitterTimeList[0][1]
  };
  return jitter;
}

function getMaintenanceTime(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('maintenance');
  const maintenanceTime = sheet.getRange(2, 1, 1, 2).getValues();
  const maintenance: MaintenanceInfo = {
    start: maintenanceTime[0][0],
    end: maintenanceTime[0][1]
  };
  return maintenance;
}

// HTTPリクエスト (DiscordのWebhook関連)

// Elph

function gorlonBossHookElph() {
  request('もうすぐゴルロンですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function modafBossHookElph() {
  request('もうすぐゴルモダフですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function gorlonBossHookLongElph() {
  request('あと30分後くらいにゴルロンですよ！', ServerName.Elph);
}

function modafBossHookLongElph() {
  request('あと30分後くらいにゴルモダフですよ！', ServerName.Elph);
}

// Rose

function gorlonBossHookRose() {
  request('次回「ゴルロン死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function modafBossHookRose() {
  request('次回「ゴルモダフ死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function gorlonBossHookLongRose() {
  request('あと30分後くらいに「ゴルロン死す!」', ServerName.Rose);
}

function modafBossHookLongRose() {
  request('あと30分後くらいに「ゴルモダフ死す!」', ServerName.Rose);
}

// Moen

function gorlonBossHookMoen() {
  request('ゴルロンの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function modafBossHookMoen() {
  request('ゴルモダフの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function gorlonBossHookLongMoen() {
  request('30分後……ゴルロンの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function modafBossHookLongMoen() {
  request('30分後……ゴルモダフの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function request(value: string, server: ServerName) {
  const discordWebhook = PropertiesService.getScriptProperties().getProperty(
    'DISCORD_HOOK_' + ServerName[server].toUpperCase()
  );
  const message = {
    content: value
  };
  postMessage(discordWebhook, message);
}

function postMessage(url, message) {
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(message)
  };

  UrlFetchApp.fetch(url, options as GoogleAppsScript.URL_Fetch.URLFetchRequestOptions);
}

// トリガ関連

function setTrigger(setTime: Date, func: string) {
  const now = new Date();
  if (setTime < now) {
    return;
  }
  // console.log('This is scheduling: ' + func + ' on ' + setTime);
  ScriptApp.newTrigger(func)
    .timeBased()
    .at(setTime)
    .create();
}

function scheduling(info: { gorlon: Boss; gormodaf: Boss; server: ServerName }) {
  info.gorlon.scheduleList.forEach(schedule => {
    if (schedule.before > 10) {
      setTrigger(schedule.time, 'gorlonBossHookLong' + ServerName[info.server]);
    } else {
      setTrigger(schedule.time, 'gorlonBossHook' + ServerName[info.server]);
    }
  });
  info.gormodaf.scheduleList.forEach(schedule => {
    if (schedule.before > 10) {
      setTrigger(schedule.time, 'modafBossHookLong' + ServerName[info.server]);
    } else {
      setTrigger(schedule.time, 'modafBossHook' + ServerName[info.server]);
    }
  });
}

function just() {
  main();
}

function setJust() {
  delJust();
  const setTime = new Date();
  setTime.setDate(setTime.getDate() + 1);
  setTime.setHours(0);
  setTime.setMinutes(0);
  setTime.setSeconds(0);
  ScriptApp.newTrigger('just')
    .timeBased()
    .at(setTime)
    .create();
}

function delTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction().indexOf('BossHook') !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function delJust() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'just') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}
