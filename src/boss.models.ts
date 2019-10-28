import { compareDate } from './util';

export function fetchAlertBefore() {
  return [5, 10];
}

export class Boss {
  private get count(): number {
    return Math.round(24 / this.bossType.interval);
  }

  // 1日分の最初と最後の時間差(分単位)
  private get betweenFirstEnd(): number {
    return Math.round(this.count * this.jitter);
  }
  public scheduleList: Schedule[];
  private bossType: BossType;
  private latestSpawnTime: Date;
  private jitter: number;
  private commonInfo: CommonInfo;

  private alertBefore: number[] = fetchAlertBefore();

  constructor(bossType: BossType, common: CommonInfo, jitter: number) {
    this.bossType = bossType;
    this.commonInfo = common;
    this.jitter = jitter;
  }

  public updateLatestSpawnTime(latestSpawnTime: Date): void {
    this.latestSpawnTime = latestSpawnTime;
    this.updateScheduleList();
  }

  private updateScheduleList(): void {
    // リストをリセット
    this.scheduleList = [];
    const today = new Date();
    for (let i = 0; i < this.count; i++) {
      this.alertBefore.forEach(before => {
        // 以降でスケジューリングされる日時を作成する。
        const toBeScheduled = new Date(today.getTime());

        toBeScheduled.setHours(this.latestSpawnTime.getHours() + this.bossType.interval * i);
        toBeScheduled.setMinutes(this.latestSpawnTime.getMinutes());

        // 未来の時間設定で、日付が変わっている可能性があるため本日に戻す
        toBeScheduled.setFullYear(today.getFullYear());
        toBeScheduled.setMonth(today.getMonth());
        toBeScheduled.setDate(today.getDate());

        // 時間ずれ調整。1回ボスあたり1ボスズレ分(通常1分くらい)進めるかつ更新時の告知を設定
        const offset = Math.round(this.calcOffset(toBeScheduled) * this.jitter);
        toBeScheduled.setMinutes(toBeScheduled.getMinutes() + offset);
        toBeScheduled.setMinutes(toBeScheduled.getMinutes() - before);

        if (compareDate(toBeScheduled, today) === -1) {
          // Offset計算により、前日の日付になっていた場合は、最終的なトリガ設定時に本日の最後に設定されるためOffsetカウントを調整
          toBeScheduled.setMinutes(toBeScheduled.getMinutes() + this.betweenFirstEnd);

          if (compareDate(toBeScheduled, today) === 0) {
            // Offsetカウント調整して、元の日付にもどった場合、そのトリガは翌日分として登録されるので本日分はなし
            return;
          }
        } else if (compareDate(toBeScheduled, today) === 1) {
          // Offset計算により、翌日の日付になっていた場合は、最終的なトリガ設定時に本日の最初に設定されるためOffsetカウントを調整
          toBeScheduled.setMinutes(toBeScheduled.getMinutes() - this.betweenFirstEnd);

          if (compareDate(toBeScheduled, today) === 0) {
            // Offsetカウント調整して、元の日付にもどった場合、そのトリガは前日分として登録されるので本日分はなし
            return;
          }
        }

        // 本通知の日付を本日分に強制変換
        toBeScheduled.setFullYear(today.getFullYear());
        toBeScheduled.setMonth(today.getMonth());
        toBeScheduled.setDate(today.getDate());

        // 本通知に対応する沸き時間は、通知時刻 + before分で算出可能
        const spawnDate = new Date(toBeScheduled.getTime() + before * 60 * 1000);
        // console.log(`The Boss ${this.bossType.name} will spawn at ${spawnDate}...`);

        // 本通知に対応する沸き時間が古くて信用できない情報の場合は通知しない
        if (this.isOldInfo(spawnDate)) {
          return;
        }

        this.scheduleList.push({ time: toBeScheduled, before });
      });
    }
  }

  /**
   * 最新更新時から、設定時刻までに何回ボスが出現したかを計算する
   * @param time
   */
  private calcOffset(time: Date): number {
    return Math.round((time.getTime() - this.latestSpawnTime.getTime()) / (this.bossType.interval * 60 * 60 * 1000));
  }

  /**
   * メンテ後に更新されていない場合を判定する
   */
  private isOldInfo(toBeScheduled: Date): boolean {
    // if (toBeScheduled >= this.commonInfo.maintenance.start && toBeScheduled <= this.commonInfo.maintenance.end) {
    //   // メンテ中
    //   return true;
    // }

    if (this.latestSpawnTime < this.commonInfo.maintenance.start && toBeScheduled > this.commonInfo.maintenance.start) {
      // メンテ後シート情報が更新されていない
      return true;
    }

    return false;
  }
}

export interface BossType {
  name: string;
  interval: number;
}

export enum ServerName {
  Elph,
  Rose,
  Moen,
  Common
}

export interface Schedule {
  time: Date;
  before: number;
}

export interface CommonInfo {
  maintenance: MaintenanceInfo;
}

export interface MaintenanceInfo {
  start: Date;
  end: Date;
}
