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
  const spawnTime = {
    golron: normalize(sheet.getRange(2, 1).getValue()),
    golmodafu: normalize(sheet.getRange(2, 2).getValue())
  };
  return spawnTime;
}

function getJitter(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('jitter');
  const jitter = {
    golron: sheet.getRange(2, 1).getValue(),
    golmodafu: sheet.getRange(2, 2).getValue()
  };
  return jitter;
}

function getMaintenanceTime(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  const sheet = spreadsheet.getSheetByName('maintenance');
  const maintenance: MaintenanceInfo = {
    end: sheet.getRange(2, 2).getValue(),
    start: sheet.getRange(2, 1).getValue()
  };
  return maintenance;
}

// HTTPリクエスト (DiscordのWebhook関連)

function golronBossHookElph() {
  request('もうすぐゴルロンですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function modafuBossHookElph() {
  request('もうすぐゴルモダフですよ！ m9( ﾟДﾟ) ﾄﾞｰﾝ', ServerName.Elph);
}

function golronBossHookRose() {
  request('次回「ゴルロン死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function modafuBossHookRose() {
  request('次回「ゴルモダフ死す!」デュエルスタンバイ♡', ServerName.Rose);
}

function golronBossHookLongElph() {
  request('あと30分後くらいにゴルロンですよ！', ServerName.Elph);
}

function modafuBossHookLongElph() {
  request('あと30分後くらいにゴルモダフですよ！', ServerName.Elph);
}

function golronBossHookLongRose() {
  request('あと30分後くらいに「ゴルロン死す!」', ServerName.Rose);
}

function modafuBossHookLongRose() {
  request('あと30分後くらいに「ゴルモダフ死す!」', ServerName.Rose);
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
  console.log('This is scheduling: ' + func + ' on ' + setTime);
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
