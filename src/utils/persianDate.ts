/**
 * تبدیل تاریخ میلادی به هجری شمسی بر اساس الگوریتم استاندارد
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const persianDays = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

/**
 * تبدیل زمان جاری یا مشخص به منطقه زمانی ایران (Asia/Tehran)
 */
export function getTehranDate(date: Date = new Date()): {
  gy: number;
  gm: number;
  gd: number;
  hours: number;
  minutes: number;
  seconds: number;
  dayOfWeek: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => {
      const p = parts.find((pt) => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    const gy = getVal('year');
    const gm = getVal('month');
    const gd = getVal('day');
    let hours = getVal('hour');
    if (hours === 24) hours = 0;
    const minutes = getVal('minute');
    const seconds = getVal('second');

    // Create a date representation to get dayOfWeek accurately in Tehran
    const tehranDay = new Date(gy, gm - 1, gd).getDay();

    return { gy, gm, gd, hours, minutes, seconds, dayOfWeek: tehranDay };
  } catch {
    // Fallback if Intl timezone is unavailable
    return {
      gy: date.getFullYear(),
      gm: date.getMonth() + 1,
      gd: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      dayOfWeek: date.getDay(),
    };
  }
}

export function getTodayShamsi(date: Date = new Date()): {
  dateString: string;
  formattedText: string;
  year: number;
  month: number;
  day: number;
  dayName: string;
  monthName: string;
  timeString: string;
} {
  const tehran = getTehranDate(date);
  const [jy, jm, jd] = gregorianToJalali(tehran.gy, tehran.gm, tehran.gd);
  const dayName = persianDays[tehran.dayOfWeek];
  const monthName = persianMonths[jm - 1];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateString = `${jy}/${pad(jm)}/${pad(jd)}`;
  const formattedText = `${dayName}، ${jd} ${monthName} ${jy}`;
  const timeString = `${pad(tehran.hours)}:${pad(tehran.minutes)}:${pad(tehran.seconds)}`;

  return {
    dateString,
    formattedText,
    year: jy,
    month: jm,
    day: jd,
    dayName,
    monthName,
    timeString,
  };
}

export function getCurrentTimeString(date: Date = new Date()): string {
  const tehran = getTehranDate(date);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(tehran.hours)}:${pad(tehran.minutes)}:${pad(tehran.seconds)}`;
}

export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function toEnglishDigits(str: number | string | undefined | null): string {
  if (str === undefined || str === null) return '';
  const s = String(str);
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let res = s;
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
  }
  return res;
}

/**
 * مرتب‌سازی کلاس‌ها بر اساس پایه (هفتم، هشتم، نهم، ...) و سپس بر اساس حروف الفبا (الف، ب، ...)
 */
export function sortClassesCustom(classes: string[]): string[] {
  if (!classes || !Array.isArray(classes)) return [];
  
  const getGradeWeight = (cls: string): number => {
    if (cls.includes('هفتم')) return 1;
    if (cls.includes('هشتم')) return 2;
    if (cls.includes('نهم')) return 3;
    if (cls.includes('دهم')) return 4;
    if (cls.includes('یازدهم')) return 5;
    if (cls.includes('دوازدهم')) return 6;
    return 99;
  };

  return [...classes].sort((a, b) => {
    const weightA = getGradeWeight(a);
    const weightB = getGradeWeight(b);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.localeCompare(b, 'fa');
  });
}
