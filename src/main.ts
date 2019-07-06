import { Boss, CommonInfo, MaintenanceInfo, ServerName } from './boss.models';
import { normalize } from './util';

const BOSS_TYPES = {
  Golmodafu: {
    interval: 8,
    name: 'Golmodafu'
  },
  Golron: {
    interval: 6,
    name: 'Golron'
  }
};

function main() {
  delTrigger();

  const sheetElph = getSpreadSheet(ServerName.Elph);

  const commonInfo: CommonInfo = {
    maintenance: getMaintenanceTime(sheetElph)
  };

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
  const golron = new Boss(BOSS_TYPES.Golron, commonInfo, jitter.golron);
  const golmodafu = new Boss(BOSS_TYPES.Golmodafu, commonInfo, jitter.golmodafu);
  // console.log(`GOLMODAFU ${JITTER[ServerName[server]].golmodafu} on ${ServerName[server]}`);
  const spawnTime = getLatestSpawnTime(spreadsheet);

  golron.updateLatestSpawnTime(spawnTime.golron);
  golmodafu.updateLatestSpawnTime(spawnTime.golmodafu);

  return {
    golmodafu,
    golron,
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
    golron: normalize(spawnTimeList[0][0]),
    golmodafu: normalize(spawnTimeList[0][1])
  };
  return spawnTime;
}

function getJitter(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('jitter');
  const jitterTimeList = sheet.getRange(2, 1, 1, 2).getValues();
  const jitter = {
    golron: jitterTimeList[0][0],
    golmodafu: jitterTimeList[0][1]
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

function golronBossHookElph() {
  request('もうすぐゴルロンですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function modafuBossHookElph() {
  request('もうすぐゴルモダフですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function golronBossHookLongElph() {
  request('あと30分後くらいにゴルロンですよ！', ServerName.Elph);
}

function modafuBossHookLongElph() {
  request('あと30分後くらいにゴルモダフですよ！', ServerName.Elph);
}

// Rose

function golronBossHookRose() {
  request('次回「ゴルロン死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function modafuBossHookRose() {
  request('次回「ゴルモダフ死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function golronBossHookLongRose() {
  request('あと30分後くらいに「ゴルロン死す!」', ServerName.Rose);
}

function modafuBossHookLongRose() {
  request('あと30分後くらいに「ゴルモダフ死す!」', ServerName.Rose);
}

// Moen

function golronBossHookMoen() {
  request('ゴルロンの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function modafuBossHookMoen() {
  request('ゴルモダフの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function golronBossHookLongMoen() {
  request('30分後……ゴルロンの敗因は…たったひとつ単純な答えだ………『てめーはおれを怒らせた』', ServerName.Moen);
}

function modafuBossHookLongMoen() {
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

function scheduling(info: { golron: Boss; golmodafu: Boss; server: ServerName }) {
  info.golron.scheduleList.forEach(schedule => {
    if (schedule.before > 10) {
      setTrigger(schedule.time, 'golronBossHookLong' + ServerName[info.server]);
    } else {
      setTrigger(schedule.time, 'golronBossHook' + ServerName[info.server]);
    }
  });
  info.golmodafu.scheduleList.forEach(schedule => {
    if (schedule.before > 10) {
      setTrigger(schedule.time, 'modafuBossHookLong' + ServerName[info.server]);
    } else {
      setTrigger(schedule.time, 'modafuBossHook' + ServerName[info.server]);
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
