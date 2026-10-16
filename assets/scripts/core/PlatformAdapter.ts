/** CONTRACT v1 dual-platform boundary. wx/tt identifiers may appear only here. */
declare const wx: any;
declare const tt: any;

export interface IStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

export interface IAudio {
  playTTS(text: string, opts?: { onEnd?: () => void; speed?: 'normal' | 'fast' }): Promise<void>;
  playBGM(name: string): void;
  playSFX(name: string): void;
  stopBGM(): void;
}

export interface IAd {
  showRewarded(adUnitId: string): Promise<boolean>;
  showInterstitial(adUnitId: string): Promise<void>;
  canShow(place: 'rewarded' | 'interstitial'): boolean;
}

export interface RankItem {
  userId: string;
  nickname: string;
  score: number;
  petSkin: string;
}

export interface ChallengePayload {
  questions: number;
  correct: number;
  durationMs: number;
}

export interface ISocial {
  submitScore(board: string, score: number): Promise<void>;
  getRank(board: string, scope: 'day' | 'week' | 'total'): Promise<RankItem[]>;
  challengeFriend(payload: ChallengePayload): Promise<string>;
  syncSave(data: object): Promise<void>;
  loadSave(): Promise<object | null>;
}

export interface ISystem {
  onMemoryWarning(cb: (level: number) => void): void;
}

export interface IPlatform {
  readonly name: 'wechat' | 'douyin';
  storage: IStorage;
  audio: IAudio;
  ad: IAd;
  social: ISocial;
  system: ISystem;
}

function storageFor(api: any): IStorage {
  return {
    async setItem(key, value) { api.setStorageSync(key, value); },
    async getItem(key) {
      const value = api.getStorageSync(key);
      return typeof value === 'string' && value.length > 0 ? value : null;
    },
    async removeItem(key) { api.removeStorageSync(key); },
  };
}

function unsupportedAudio(): IAudio {
  return {
    async playTTS() { throw new Error('TTS provider is not configured.'); },
    playBGM() {},
    playSFX() {},
    stopBGM() {},
  };
}

function adsFor(api: any): IAd {
  return {
    canShow: () => true,
    showRewarded: (adUnitId) => new Promise<boolean>((resolve, reject) => {
      const ad = api.createRewardedVideoAd({ adUnitId });
      const onClose = (result: { isEnded?: boolean } | undefined) => {
        ad.offClose(onClose);
        resolve(result?.isEnded !== false);
      };
      const onError = (error: unknown) => {
        ad.offError(onError);
        reject(error);
      };
      ad.onClose(onClose);
      ad.onError(onError);
      Promise.resolve(ad.show()).catch(() => ad.load().then(() => ad.show())).catch(onError);
    }),
    showInterstitial: async (adUnitId) => {
      const ad = api.createInterstitialAd({ adUnitId });
      await Promise.resolve(ad.show()).catch(() => ad.load().then(() => ad.show()));
    },
  };
}

function unsupportedSocial(): ISocial {
  return {
    async submitScore() { throw new Error('Social provider is not configured.'); },
    async getRank() { return []; },
    async challengeFriend() { throw new Error('Social provider is not configured.'); },
    async syncSave() { throw new Error('Cloud save provider is not configured.'); },
    async loadSave() { return null; },
  };
}

function platformFor(name: 'wechat' | 'douyin', api: any): IPlatform {
  return {
    name,
    storage: storageFor(api),
    audio: unsupportedAudio(),
    ad: adsFor(api),
    social: unsupportedSocial(),
    system: {
      onMemoryWarning: (callback) => {
        if (typeof api.onMemoryWarning === 'function') api.onMemoryWarning(callback);
      },
    },
  };
}

/** 编辑器环境兜底：无 wx/tt 时用内存 Map 模拟存储、关闭广告，
 *  这样在 Cocos 编辑器里也能跑。TTS 与社交保持"未配置即报错"，
 *  避免静默伪成功。 */
function editorFallback(): IPlatform {
  const values = new Map<string, string>();
  return {
    name: 'wechat',
    storage: {
      async setItem(key, value) { values.set(key, value); },
      async getItem(key) { return values.get(key) ?? null; },
      async removeItem(key) { values.delete(key); },
    },
    audio: unsupportedAudio(),
    ad: {
      canShow: () => false,
      async showRewarded() { return false; },
      async showInterstitial() {},
    },
    social: unsupportedSocial(),
    system: { onMemoryWarning() {} },
  };
}

export class PlatformAdapter {
  private static currentPlatform: IPlatform | null = null;

  static get current(): IPlatform {
    if (!this.currentPlatform) {
      if (typeof wx !== 'undefined') this.currentPlatform = platformFor('wechat', wx);
      else if (typeof tt !== 'undefined') this.currentPlatform = platformFor('douyin', tt);
      else this.currentPlatform = editorFallback();
    }
    return this.currentPlatform;
  }

  static setCurrent(platform: IPlatform): void {
    this.currentPlatform = platform;
  }
}
