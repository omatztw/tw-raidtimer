/**
 * 日付を比較する。
 * date1のほうが新しければ1, 古ければ-1, 同じなら0を返す
 * @param date1
 * @param date2
 */
export function compareDate(date1: Date, date2: Date): number {
  const year1 = date1.getFullYear();
  const month1 = date1.getMonth() + 1;
  const day1 = date1.getDate();

  const year2 = date2.getFullYear();
  const month2 = date2.getMonth() + 1;
  const day2 = date2.getDate();

  if (year1 === year2) {
    if (month1 === month2) {
      if (day1 === day2) {
        return 0;
      } else {
        if (day1 > day2) {
          return 1;
        } else {
          return -1;
        }
      }
    } else {
      if (month1 > month2) {
        return 1;
      } else {
        return -1;
      }
    }
  } else {
    if (year1 > year2) {
      return 1;
    } else {
      return -1;
    }
  }
}

/**
 * シートの時刻を分単位にならす処理 (30秒以上は1分繰り上げ)
 * @param time
 */
export function normalize(time: Date) {
  return new Date(
    time.getFullYear(),
    time.getMonth(),
    time.getDate(),
    time.getHours(),
    time.getMinutes() + (time.getSeconds() >= 30 ? 1 : 0)
  );
}
