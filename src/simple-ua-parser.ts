import { UserAgentInfo } from './browser-context';

// The Bugsnag v5 API requires doing your own UA string parsing, requiring a
// `browserName`, `browserVersion`, `osName`, `osVersion`, etc.
//
// That's very unfriendly and probably why the official client still uses the v4
// API which takes a `userAgent` parameter and appears to parse it on the
// server.
//
// Nevertheless, we're using the v5 API for now so we should do the parsing
// ourselves.
//
// Note that UA parser libraries typically are very heavyweight since they try
// to cover every user agent that ever existed including various bots etc.
//
// However, all we really care about is differentiating between the most common
// _browsers_ and their respective platforms / OSes.
//
// Furthermore, we want this to be as lightweight as possible so this is very
// deliberately a very barebones approach. We can add other user agents if and
// when they become interesting.
//
// This is based on
// https://github.com/DamonOehlman/detect-browser/blob/master/src/index.ts but
// adapted quite heavily.

export function parseUserAgent(userAgent: string): UserAgentInfo {
  const matchedRule: UserAgentMatch = matchUserAgent(userAgent);

  if (!matchedRule) {
    return {};
  }

  const [name, match] = matchedRule;
  const os = detectOS(userAgent);
  const device = os?.osName === 'iOS' ? detectAppleDevice(userAgent) : {};

  return {
    browserName: name,
    browserVersion: match[1],
    osName: os?.osName,
    osVersion: os?.osVersion,
    manufacturer: device?.manufacturer,
    model: device?.model,
  };
}

type UserAgentRule = [string, RegExp];
const userAgentRules: UserAgentRule[] = [
  ['Edge (EdgeHTML)', /Edge\/([0-9\._]+)/],
  ['Edge (iOS)', /EdgiOS\/([0-9\._]+)/],
  ['Yandex', /YaBrowser\/([0-9\._]+)/],
  ['KakaoTalk', /KAKAOTALK\s([0-9\.]+)/],
  ['Samsung', /SamsungBrowser\/([0-9\.]+)/],
  ['Silk', /\bSilk\/([0-9._-]+)\b/],
  ['MIUI', /MiuiBrowser\/([0-9\.]+)$/],
  ['Beaker', /BeakerBrowser\/([0-9\.]+)/],
  ['Edge (Chromium)', /EdgA?\/([0-9\.]+)/],
  [
    'Chromium WebView',
    /(?!Chrom.*OPR)wv\).*Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/,
  ],
  ['Chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
  ['Chrome (iOS)', /CriOS\/([0-9\.]+)(:?\s|$)/],
  ['Firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
  ['Firefox (iOS)', /FxiOS\/([0-9\.]+)/],
  ['Opera Mini', /Opera Mini.*Version\/([0-9\.]+)/],
  ['Opera', /Opera\/([0-9\.]+)(?:\s|$)/],
  ['Opera', /OPR\/([0-9\.]+)(:?\s|$)/],
  ['Internet Explorer', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/],
  ['Internet Explorer', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
  ['Internet Explorer', /MSIE\s(7\.0)/],
  ['Blackberry', /BB10;\sTouch.*Version\/([0-9\.]+)/],
  ['Android', /Android\s([0-9\.]+)/],
  ['Safari (iOS)', /Version\/([0-9\._]+).*Mobile.*Safari.*/],
  ['Safari', /Version\/([0-9\._]+).*Safari/],
  ['Facebook', /FB[AS]V\/([0-9\.]+)/],
  ['Instagram', /Instagram\s([0-9\.]+)/],
  ['iOS WebView', /AppleWebKit\/([0-9\.]+).*Mobile/],
  ['iOS WebView', /AppleWebKit\/([0-9\.]+).*Gecko\)$/],
];

type UserAgentMatch = [string, RegExpExecArray] | false;

function matchUserAgent(userAgent: string): UserAgentMatch {
  return (
    userAgent !== '' &&
    userAgentRules.reduce<UserAgentMatch>(
      (matched: UserAgentMatch, [browser, regex]) => {
        if (matched) {
          return matched;
        }

        const uaMatch = regex.exec(userAgent);
        return !!uaMatch && [browser, uaMatch];
      },
      false
    )
  );
}

type OperatingSystemRule = [string, string | undefined, RegExp];

const operatingSystemRules: OperatingSystemRule[] = [
  ['iOS', undefined, /iP(hone|od|ad)/],
  ['Android', undefined, /Android/],
  ['BlackBerry', undefined, /BlackBerry|BB10/],
  ['Windows Mobile', undefined, /IEMobile/],
  ['Kindle', undefined, /Kindle/],
  ['Windows', '3.11', /Win16/],
  ['Windows', '95', /(Windows 95)|(Win95)|(Windows_95)/],
  ['Windows', '98', /(Windows 98)|(Win98)/],
  ['Windows', '2000', /(Windows NT 5.0)|(Windows 2000)/],
  ['Windows', 'XP', /(Windows NT 5.1)|(Windows XP)/],
  ['Windows', 'Server 2003', /(Windows NT 5.2)/],
  ['Windows', 'Vista', /(Windows NT 6.0)/],
  ['Windows', '7', /(Windows NT 6.1)/],
  ['Windows', '8', /(Windows NT 6.2)/],
  ['Windows', '8.1', /(Windows NT 6.3)/],
  ['Windows', '10+', /(Windows NT 10.0)/],
  ['Windows', 'ME', /Windows ME/],
  ['Open BSD', undefined, /OpenBSD/],
  ['Sun OS', undefined, /SunOS/],
  ['Chrome OS', undefined, /CrOS/],
  ['Linux', undefined, /(Linux)|(X11)/],
  ['Mac OS', undefined, /(Mac_PowerPC)|(Macintosh)/],
  ['QNX', undefined, /QNX/],
  ['BeOS', undefined, /BeOS/],
  ['OS/2', undefined, /OS\/2/],
];

function detectOS(
  userAgent: string
): { osName: string; osVersion?: string } | null {
  for (const [osName, osVersion, regex] of operatingSystemRules) {
    const match = regex.exec(userAgent);
    if (match) {
      return { osName, osVersion };
    }
  }

  return null;
}

function detectAppleDevice(userAgent: string): {
  manufacturer?: string;
  model?: string;
} | null {
  const matches = /iPad|iPhone|iPod/.exec(userAgent);
  if (matches) {
    return { manufacturer: 'Apple', model: matches[0] };
  }

  if (
    /MacIntel/.test(userAgent) &&
    self.navigator &&
    self.navigator.maxTouchPoints &&
    self.navigator.maxTouchPoints > 2
  ) {
    return { manufacturer: 'Apple', model: 'iPad' };
  }

  return null;
}
