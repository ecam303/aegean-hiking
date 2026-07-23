(function () {
  const SUPPORTED_LANGUAGES = ["en", "el", "fr", "nl"];
  const STORAGE_KEY = "aegean.site.language";
  const FALLBACK_LANGUAGE = "en";

  const state = {
    language: FALLBACK_LANGUAGE,
    uiDictionary: {},
    trailDictionaries: {}
  };

  function normalizeLanguage(value) {
    const candidate = (value || "").toLowerCase().trim();
    return SUPPORTED_LANGUAGES.includes(candidate) ? candidate : FALLBACK_LANGUAGE;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPathValue(obj, path) {
    return path.split(".").reduce((acc, key) => {
      if (acc && Object.prototype.hasOwnProperty.call(acc, key)) return acc[key];
      return undefined;
    }, obj);
  }

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path} (${response.status})`);
    }
    return response.json();
  }

  async function loadUiDictionary(language) {
    try {
      return await loadJson(`locales/${language}.json`);
    } catch (error) {
      if (language !== FALLBACK_LANGUAGE) {
        return loadJson(`locales/${FALLBACK_LANGUAGE}.json`);
      }
      throw error;
    }
  }

  async function ensureTrailDictionary(language) {
    if (language === FALLBACK_LANGUAGE) return;
    if (state.trailDictionaries[language]) return;

    try {
      state.trailDictionaries[language] = await loadJson(`locales/trails/${language}.json`);
    } catch (error) {
      state.trailDictionaries[language] = {};
      console.warn(`No trail locale file found for '${language}'.`, error);
    }
  }

  function t(key, fallback) {
    const translated = getPathValue(state.uiDictionary, key);
    if (typeof translated === "string") return translated;
    return fallback !== undefined ? fallback : key;
  }

  function apply(root) {
    const container = root || document;

    container.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const fallback = el.dataset.i18nFallback || el.textContent;
      el.textContent = t(key, fallback);
    });

    container.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (!key) return;
      const fallback = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", t(key, fallback));
    });

    container.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      const fallback = el.getAttribute("title") || "";
      el.setAttribute("title", t(key, fallback));
    });
  }

  function syncSelectors() {
    document.querySelectorAll(".lang-select").forEach(select => {
      select.value = state.language;
    });
  }

  function bindSelectors() {
    document.querySelectorAll(".lang-select").forEach(select => {
      if (select.dataset.langBound === "1") return;
      select.dataset.langBound = "1";
      select.addEventListener("change", event => {
        setLanguage(event.target.value);
      });
    });
  }

  async function setLanguage(nextLanguage, options) {
    const language = normalizeLanguage(nextLanguage);
    const initial = !!(options && options.initial);

    state.uiDictionary = await loadUiDictionary(language);
    state.language = language;

    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);

    bindSelectors();
    syncSelectors();
    apply(document);

    window.dispatchEvent(new CustomEvent("languagechange", {
      detail: { language, initial }
    }));
  }

  async function init() {
    bindSelectors();

    const browserLanguage = (navigator.language || FALLBACK_LANGUAGE).slice(0, 2);
    const storedLanguage = localStorage.getItem(STORAGE_KEY);
    const language = normalizeLanguage(storedLanguage || browserLanguage || FALLBACK_LANGUAGE);

    await setLanguage(language, { initial: true });
  }

  async function translateTrailData(data, islandId) {
    if (state.language === FALLBACK_LANGUAGE) return data;

    await ensureTrailDictionary(state.language);
    const langDict = state.trailDictionaries[state.language] || {};
    const islandDict = langDict[islandId];
    if (!islandDict) return data;

    const translated = deepClone(data);

    if (translated.properties && islandDict.properties) {
      Object.assign(translated.properties, islandDict.properties);
    }

    if (Array.isArray(translated.features) && islandDict.waypoints) {
      translated.features = translated.features.map(feature => {
        if (!feature.properties || feature.properties.kind !== "waypoint") return feature;
        const key = String(feature.properties.order);
        const wpTranslation = islandDict.waypoints[key];
        if (!wpTranslation) return feature;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...wpTranslation
          }
        };
      });
    }

    return translated;
  }

  window.i18n = {
    init,
    apply,
    t,
    setLanguage,
    getLanguage: function () {
      return state.language;
    },
    translateTrailData
  };
})();
