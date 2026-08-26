(() => {
  const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());

  const haptic = async (style = 'Light') => {
    try {
      const plugin = window.Capacitor?.Plugins?.Haptics;
      if (plugin) await plugin.impact({ style });
      else if (navigator.vibrate) navigator.vibrate(style === 'Heavy' ? 35 : 12);
    } catch {}
  };

  const share = async ({ title, text, url = location.href }) => {
    try {
      const plugin = window.Capacitor?.Plugins?.Share;
      if (plugin) return await plugin.share({ title, text, url, dialogTitle: '여행 공유' });
      if (navigator.share) return await navigator.share({ title, text, url });
      await navigator.clipboard.writeText(url);
      return { activityType: 'clipboard' };
    } catch (error) {
      if (error?.name !== 'AbortError') throw error;
      return null;
    }
  };

  const position = async () => {
    const plugin = window.Capacitor?.Plugins?.Geolocation;
    if (plugin) return plugin.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }));
  };

  const openExternal = async (url) => {
    const browser = window.Capacitor?.Plugins?.Browser;
    if (browser) return browser.open({ url });
    window.open(url, '_blank', 'noopener');
  };

  if ('serviceWorker' in navigator && !isNative() && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }

  window.HotelnGoNative = { isNative, haptic, share, position, openExternal };
})();
