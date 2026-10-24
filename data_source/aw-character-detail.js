(function () {
  "use strict";

  const root = document.body;
  if (!root?.classList.contains("aw-character-detail-page")) return;

  const characterId = root.dataset.characterId || document.querySelector('meta[name="character-id"]')?.content || "";
  const language = root.dataset.awCharacterLanguage === "ar" ? "ar" : "en";
  const characterConfig = document.querySelector(".character-page-showcase-config");
  const deferLikesUntilInteraction = characterConfig?.dataset.deferLikesUntilInteraction === "true";
  const displayName = characterConfig?.dataset.name || characterId || (language === "ar" ? "الشخصية" : "Character");
  const initialHash = location.hash;
  const projectionUrl = `/data/character-details/${encodeURIComponent(characterId)}.json?v=20260715-hiyuki-pilot14`;
  const strings = language === "ar"
    ? {
        loading: "جاري التحميل…",
        failed: "تعذر تحميل البيانات. حاول مرة ثانية.",
        label: "الحركة",
        value: "القيمة",
        signIn: "سجل دخولك لإضافة إعجاب.",
        verify: "فعّل بريدك الإلكتروني قبل إضافة إعجاب.",
        likeError: "تعذر تحديث الإعجاب. حاول مرة ثانية.",
        likes: "إعجاب",
        videosError: "تعذر تحميل الفيديوهات.",
        video: `فيديو ${displayName}`,
        showDetails: "عرض التفاصيل",
        hideDetails: "إخفاء التفاصيل",
      }
    : {
        loading: "Loading…",
        failed: "Data could not be loaded. Try again.",
        label: "Move",
        value: "Value",
        signIn: "Sign in to like this character.",
        verify: "Verify your email before liking.",
        likeError: "The like could not be updated. Try again.",
        likes: "likes",
        videosError: "Videos could not be loaded.",
        video: `${displayName} video`,
        showDetails: "Show details",
        hideDetails: "Hide details",
      };

  let projectionPromise = null;

  function loadProjection() {
    if (!projectionPromise) {
      projectionPromise = fetch(projectionUrl, { cache: "force-cache", credentials: "same-origin" })
        .then((response) => {
          if (!response.ok) throw new Error(`Projection HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (data?.schemaVersion !== 1 || data.characterId !== characterId || !data.stats || !data.multipliers) {
            throw new Error("Invalid character projection");
          }
          return data;
        })
        .catch((error) => {
          projectionPromise = null;
          throw error;
        });
    }
    return projectionPromise;
  }

  const BUTTON_ICON_SVGS = Object.freeze({
    heart: '<path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 6.9l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z"/>',
    share: '<path d="M8.2 10.75 15.6 6.4M8.2 13.25l7.4 4.35"/><circle cx="5.5" cy="12" r="2.6" fill="currentColor" stroke="none"/><circle cx="18" cy="5" r="2.6" fill="currentColor" stroke="none"/><circle cx="18" cy="19" r="2.6" fill="currentColor" stroke="none"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5.5 3.5-5.5 3.5Z" fill="currentColor" stroke="none"/>',
    users: '<circle cx="9" cy="7.5" r="3"/><circle cx="17.8" cy="9.2" r="2.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M15.3 14.6a4.8 4.8 0 0 1 6.2 4.6"/>',
    retry: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.2 9A7.5 7.5 0 0 0 5.5 6.5L4 8M5.8 15A7.5 7.5 0 0 0 18.5 17.5L20 16"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 19v2h16v-2"/>',
  });

  const buttonIconNodeCache = new Map();

  function decorateButton(button) {
    if (!button) return;
    if (button.querySelector(":scope > .awcd-btn__icon")) {
      button.classList.add("awcd-btn--decorated");
      return;
    }
    const paths = BUTTON_ICON_SVGS[button.dataset.awcdIcon];
    if (!paths) return;
    const label = String(button.textContent || button.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
    if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", label);
    const icon = document.createElement("span");
    icon.className = "awcd-btn__icon";
    icon.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "awcd-action-icon__svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    let cachedNodes = buttonIconNodeCache.get(button.dataset.awcdIcon);
    if (!cachedNodes) {
      const parsed = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>`, "image/svg+xml");
      cachedNodes = Array.from(parsed.documentElement.children, node => document.importNode(node, true));
      buttonIconNodeCache.set(button.dataset.awcdIcon, cachedNodes);
    }
    svg.append(...cachedNodes.map(node => node.cloneNode(true)));
    icon.append(svg);
    const labelNode = document.createElement("span");
    labelNode.className = "awcd-btn__label";
    labelNode.dataset.awcdLabel = label;
    const textNode = document.createElement("span");
    textNode.className = "awcd-btn__label-text";
    textNode.textContent = label;
    labelNode.append(textNode);
    button.replaceChildren(icon, labelNode);
    button.classList.add("awcd-btn--decorated");
  }

  function decorateButtons(scope) {
    const host = scope || document;
    if (host.matches?.("[data-awcd-icon]")) decorateButton(host);
    host.querySelectorAll?.("[data-awcd-icon]").forEach(decorateButton);
  }

  window.ArabWuwaCharacterDetail = Object.freeze({ decorateButtons });
  decorateButtons(document);

  function initGlossary() {
    const popover = document.querySelector("[data-awcd-glossary-popover]");
    const title = popover?.querySelector("[data-awcd-glossary-title]");
    const body = popover?.querySelector("[data-awcd-glossary-body]");
    if (!popover || !title || !body || !document.querySelector("[data-awcd-term]")) return;

    const mobileQuery = window.matchMedia("(max-width: 640px)");
    let activeTrigger = null;
    let positionFrame = 0;

    function normalizedLabel(value) {
      return String(value || "").replace(/\s+/g, " ").trim().toLocaleLowerCase(language === "ar" ? "ar" : "en");
    }

    function cleanDefinition(source, expectedTitle) {
      const clone = source.cloneNode(true);
      clone.removeAttribute?.("id");
      clone.querySelectorAll?.("[id]").forEach((node) => node.removeAttribute("id"));
      clone.querySelectorAll?.("[data-awcd-term]").forEach((trigger) => {
        trigger.replaceWith(document.createTextNode(trigger.textContent || ""));
      });
      let leadingElement = clone.firstElementChild;
      while (leadingElement && !/^H[1-6]$/u.test(leadingElement.tagName) && leadingElement.firstElementChild) {
        leadingElement = leadingElement.firstElementChild;
      }
      if (/^H[1-6]$/u.test(leadingElement?.tagName || "") && normalizedLabel(leadingElement.textContent) === normalizedLabel(expectedTitle)) {
        leadingElement.remove();
      }
      return clone;
    }

    function positionPopover() {
      positionFrame = 0;
      if (!activeTrigger || popover.hidden) return;
      if (mobileQuery.matches) {
        popover.dataset.awcdPlacement = "mobile";
        popover.style.removeProperty("top");
        popover.style.removeProperty("left");
        return;
      }

      const triggerRect = activeTrigger.getBoundingClientRect();
      if (triggerRect.bottom < 0 || triggerRect.top > window.innerHeight) {
        closePopover();
        return;
      }
      popover.dataset.awcdPlacement = "desktop";
      const popoverRect = popover.getBoundingClientRect();
      const gutter = 12;
      const gap = 10;
      const below = triggerRect.bottom + gap;
      const above = triggerRect.top - popoverRect.height - gap;
      const placeAbove = below + popoverRect.height > window.innerHeight - gutter && above >= gutter;
      const top = placeAbove ? above : Math.min(below, window.innerHeight - popoverRect.height - gutter);
      const centered = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
      const left = Math.max(gutter, Math.min(centered, window.innerWidth - popoverRect.width - gutter));
      popover.style.top = `${Math.max(gutter, top)}px`;
      popover.style.left = `${left}px`;
    }

    function queuePosition() {
      if (positionFrame || !activeTrigger || popover.hidden) return;
      positionFrame = window.requestAnimationFrame(positionPopover);
    }

    function openPopover(trigger) {
      const definitionId = trigger.dataset.awcdDefinition;
      const definition = definitionId ? document.getElementById(definitionId) : null;
      if (!definition) return;
      if (activeTrigger && activeTrigger !== trigger) {
        activeTrigger.setAttribute("aria-expanded", "false");
      }
      activeTrigger = trigger;
      const termTitle = trigger.dataset.awcdTermTitle || trigger.textContent || "";
      title.textContent = termTitle;
      body.replaceChildren(cleanDefinition(definition, termTitle));
      trigger.setAttribute("aria-expanded", "true");
      popover.hidden = false;
      popover.style.visibility = "hidden";
      positionPopover();
      popover.style.removeProperty("visibility");
    }

    function closePopover() {
      if (positionFrame) window.cancelAnimationFrame(positionFrame);
      positionFrame = 0;
      if (activeTrigger) {
        activeTrigger.setAttribute("aria-expanded", "false");
      }
      activeTrigger = null;
      popover.hidden = true;
      popover.removeAttribute("data-awcd-placement");
      popover.style.removeProperty("top");
      popover.style.removeProperty("left");
      body.replaceChildren();
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.("[data-awcd-term]");
      if (trigger) {
        if (activeTrigger === trigger) closePopover();
        else openPopover(trigger);
        return;
      }
      if (activeTrigger && !popover.contains(event.target)) closePopover();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !activeTrigger) return;
      const triggerToRestore = activeTrigger;
      closePopover();
      triggerToRestore.focus({ preventScroll: true });
    });
    window.addEventListener("scroll", queuePosition, { passive: true });
    window.addEventListener("resize", queuePosition, { passive: true });
    window.visualViewport?.addEventListener("resize", queuePosition, { passive: true });
  }

  function displayLevel(raw) {
    const value = Number(raw);
    return value === 1 ? 1 : (value - 1) * 10;
  }

  function formatStat(index, value) {
    if (index !== 9) return String(value ?? "");
    const text = String(value ?? "").trim();
    return text.includes("%") ? text : `${text}%`;
  }

  function initStats() {
    const slider = document.querySelector("[data-awcd-stat-slider]");
    const output = document.querySelector("[data-awcd-stat-output]");
    const levelLabel = document.querySelector("[data-awcd-stat-level]");
    if (!slider || !output) return;
    let requestToken = 0;
    slider.addEventListener("input", async () => {
      const token = ++requestToken;
      const raw = Number(slider.value);
      const level = displayLevel(raw);
      output.textContent = String(level);
      if (levelLabel) levelLabel.textContent = String(level);
      slider.setAttribute("aria-valuetext", language === "ar" ? `المستوى ${level}` : `Level ${level}`);
      slider.setAttribute("aria-busy", "true");
      try {
        const data = await loadProjection();
        if (token !== requestToken) return;
        const row = data.stats.rows[raw - 1];
        if (!Array.isArray(row)) throw new Error("Missing stat row");
        document.querySelectorAll("[data-awcd-stat-index]").forEach((card) => {
          const index = Number(card.dataset.awcdStatIndex);
          const value = card.querySelector("strong");
          if (value) value.textContent = formatStat(index, row[index]);
        });
      } catch (error) {
        console.warn("[aw-character-detail] stat projection failed", error);
        showToast(strings.failed);
      } finally {
        if (token === requestToken) slider.removeAttribute("aria-busy");
      }
    });
  }

  function renderMultiplierTable(container, rows, levelIndex, localizedLabels) {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    [strings.label, strings.value].forEach((text) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = text;
      header.append(th);
    });
    thead.append(header);
    const tbody = document.createElement("tbody");
    rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      if (row.id !== undefined) tr.dataset.hitId = String(row.id);
      const label = document.createElement("th");
      label.scope = "row";
      label.textContent = localizedLabels?.[rowIndex] || row.label;
      label.lang = localizedLabels?.[rowIndex] ? "ar" : "en";
      label.dir = localizedLabels?.[rowIndex] ? "rtl" : "ltr";
      const value = document.createElement("td");
      value.textContent = String(row.values?.[levelIndex] ?? "—");
      value.dir = "ltr";
      tr.append(label, value);
      tbody.append(tr);
    });
    table.append(thead, tbody);
    container.replaceChildren(table);
  }

  function initMultipliers() {
    document.querySelectorAll("[data-awcd-multipliers]").forEach((details) => {
      const slider = details.querySelector("[data-awcd-multiplier-slider]");
      const output = details.querySelector("[data-awcd-multiplier-level]");
      const container = details.querySelector("[data-awcd-multiplier-table]");
      const labelsNode = details.querySelector("[data-awcd-multiplier-labels]");
      let localizedLabels = null;
      if (labelsNode) {
        try {
          const parsed = JSON.parse(labelsNode.textContent || "[]");
          if (Array.isArray(parsed) && parsed.every((label) => typeof label === "string" && label.trim())) localizedLabels = parsed;
        } catch (error) {
          console.warn("[aw-character-detail] localized multiplier labels failed", error);
        }
      }
      let rows = null;
      let loading = null;

      async function hydrate() {
        if (rows) return rows;
        if (!loading) {
          container?.setAttribute("aria-busy", "true");
          loading = loadProjection()
            .then((data) => {
              rows = data.multipliers[details.dataset.awcdMultipliers];
              if (!Array.isArray(rows) || rows.length === 0) throw new Error("Empty multiplier group");
              return rows;
            })
            .finally(() => {
              loading = null;
              container?.removeAttribute("aria-busy");
            });
        }
        return loading;
      }

      async function update() {
        try {
          const dataRows = await hydrate();
          const levelIndex = Number(slider?.value || 10) - 1;
          if (output) output.textContent = String(levelIndex + 1);
          if (container) renderMultiplierTable(container, dataRows, levelIndex, localizedLabels);
        } catch (error) {
          console.warn("[aw-character-detail] multiplier projection failed", error);
          if (container) container.textContent = strings.failed;
        }
      }

      details.addEventListener("toggle", () => { if (details.open) update(); });
      slider?.addEventListener("input", update);
    });
  }

  let toastTimer = 0;
  function showToast(message) {
    const region = document.querySelector("[data-aw-toasts]") || document.body;
    let toast = region.querySelector(".awcd-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "awcd-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      region.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function formatLikeCount(value) {
    const count = Math.max(0, Number(value) || 0);
    if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(count);
  }

  function initLikes() {
    const button = document.querySelector("[data-awcd-like]");
    const countNode = document.querySelector("[data-awcd-like-count]");
    if (!button || !countNode || !characterId) return;
    let currentUser = window.__arabWuwaAuth?.currentUser || null;
    let liked = false;
    let count = 0;
    let busy = false;
    let lastLoadedIdentity = null;
    let inFlight = null;
    let inFlightIdentity = null;

    function identity(user) {
      return user?.uid ? `user:${user.uid}` : "anonymous";
    }

    async function authHeaders() {
      if (currentUser && typeof window.__arabWuwaAuth?.getAuthHeaders === "function") return window.__arabWuwaAuth.getAuthHeaders(currentUser);
      if (!currentUser || typeof currentUser.getIdToken !== "function") return {};
      const token = await currentUser.getIdToken();
      return { Authorization: `Bearer ${token}`, "X-Firebase-Token": token };
    }

    function render() {
      button.classList.toggle("is-active", liked);
      button.setAttribute("aria-pressed", String(liked));
      button.disabled = busy;
      countNode.textContent = formatLikeCount(count);
      countNode.setAttribute("aria-label", `${formatLikeCount(count)} ${strings.likes}`);
    }

    async function load(force) {
      const requestedIdentity = identity(currentUser);
      if (!force && lastLoadedIdentity === requestedIdentity) return;
      if (inFlight && inFlightIdentity === requestedIdentity) return inFlight;
      const userAtRequest = currentUser;
      inFlightIdentity = requestedIdentity;
      inFlight = (async () => {
        const headers = await authHeaders();
        const response = await fetch(`/api/likes-get.php?characterId=${encodeURIComponent(characterId)}`, {
          method: "GET", headers, credentials: "same-origin", cache: "no-store",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || `Likes HTTP ${response.status}`);
        if (identity(currentUser) !== requestedIdentity || currentUser !== userAtRequest) return;
        count = Math.max(0, Number(data.count) || 0);
        liked = Boolean(data.liked);
        lastLoadedIdentity = requestedIdentity;
        render();
      })().catch((error) => {
        console.warn("[aw-character-detail] likes read failed", error);
        countNode.textContent = "—";
      }).finally(() => {
        if (inFlightIdentity === requestedIdentity) {
          inFlight = null;
          inFlightIdentity = null;
        }
      });
      return inFlight;
    }

    function openSignIn() {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.hidden = true;
      trigger.dataset.awAuthOpen = "sign-in";
      document.body.append(trigger);
      trigger.click();
      trigger.remove();
    }

    button.addEventListener("click", async () => {
      if (busy) return;
      if (!currentUser) { showToast(strings.signIn); openSignIn(); return; }
      if (!currentUser.emailVerified) { showToast(strings.verify); return; }
      busy = true;
      render();
      try {
        const headers = await authHeaders();
        const response = await fetch("/api/likes-toggle.php", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ characterId }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || `Likes HTTP ${response.status}`);
        count = Math.max(0, Number(data.count) || 0);
        liked = Boolean(data.liked);
        lastLoadedIdentity = identity(currentUser);
      } catch (error) {
        console.error("[aw-character-detail] like toggle failed", error);
        showToast(strings.likeError);
      } finally {
        busy = false;
        render();
      }
    });

    document.addEventListener("aw:authchange", (event) => {
      const nextUser = event.detail?.user || null;
      if (identity(nextUser) === identity(currentUser)) return;
      currentUser = nextUser;
      load(false);
    });
    render();
    if (deferLikesUntilInteraction) {
      let deferredLoadStarted = false;
      const startDeferredLoad = () => {
        if (deferredLoadStarted) return;
        deferredLoadStarted = true;
        window.removeEventListener("scroll", startDeferredLoad);
        window.removeEventListener("pointerdown", startDeferredLoad);
        window.removeEventListener("keydown", startDeferredLoad);
        load(false);
      };
      window.addEventListener("scroll", startDeferredLoad, { passive: true, once: true });
      window.addEventListener("pointerdown", startDeferredLoad, { passive: true, once: true });
      window.addEventListener("keydown", startDeferredLoad, { once: true });
      window.setTimeout(startDeferredLoad, 30000);
    } else {
      load(false);
    }
  }

  function loadScriptOnce(src, marker) {
    const existing = document.querySelector(`script[data-awcd-lazy="${marker}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return Promise.resolve();
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.awcdLazy = marker;
      script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }

  function initShareLoader() {
    const button = document.querySelector("[data-awcd-share-loader]");
    if (!button) return;
    let loading = false;
    button.addEventListener("click", async () => {
      if (window.ArabWuwaCharacterShare || loading) return;
      loading = true;
      button.disabled = true;
      try {
        await loadScriptOnce("/js/character-share.js?v=20260720-character-share-webp1", "share");
        button.disabled = false;
        loading = false;
        button.focus({ preventScroll: true });
        button.click();
      } catch (error) {
        console.error("[aw-character-detail] share module failed", error);
        button.disabled = false;
        loading = false;
        showToast(strings.failed);
      }
    });
  }

  function observeOnce(element, callback, margin) {
    if (!element) return;
    if (!("IntersectionObserver" in window)) { callback(); return; }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      callback();
    }, { rootMargin: margin || "500px 0px" });
    observer.observe(element);
  }

  function initTeamsLoader() {
    const teamsRoot = document.querySelector("[data-awcd-teams-root]");
    if (!teamsRoot) return;
    const rememberFollowingHash = (hash) => {
      if (!hash) return;
      let anchorId = "";
      try { anchorId = decodeURIComponent(hash.slice(1)); } catch { anchorId = ""; }
      const anchor = anchorId ? document.getElementById(anchorId) : null;
      if (anchor && teamsRoot.getBoundingClientRect().top < anchor.getBoundingClientRect().top) teamsRoot.dataset.awcdPreserveHash = hash;
    };
    rememberFollowingHash(initialHash);
    document.querySelectorAll(".awcd-section-nav a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => rememberFollowingHash(link.hash));
    });
    let initialized = false;
    const load = async () => {
      if (initialized) return;
      initialized = true;
      try {
        await loadScriptOnce("/js/aw-character-detail-teams.js?v=20260716-character-team-empty2", "teams");
        window.ArabWuwaCharacterTeams?.init(teamsRoot);
      } catch (error) {
        initialized = false;
        console.error("[aw-character-detail] teams module failed", error);
        showToast(strings.failed);
      }
    };
    teamsRoot.querySelector("[data-awcd-teams-load]")?.addEventListener("click", load);
    observeOnce(teamsRoot, load, "650px 0px");
  }

  function initSynergiesLoader() {
    const section = document.querySelector(".awcd-synergies");
    if (!section) return;
    observeOnce(section, async () => {
      try {
        await loadScriptOnce("/js/aw-character-synergies.js?v=20260926-synergies-live1", "synergies");
        await window.ArabWuwaCharacterSynergies?.init(section, characterId, language);
      } catch (error) {
        // Keep the generated cards visible if the live source is unavailable.
        console.warn("[aw-character-detail] synergies refresh failed", error);
      }
    }, "500px 0px");
  }

  function youtubeId(rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || "";
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      const match = url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
      return match?.[1] || "";
    } catch (_) {
      return "";
    }
  }

  function initVideos() {
    const videoRoot = document.querySelector("[data-awcd-videos-root]");
    if (!videoRoot) return;
    const state = videoRoot.querySelector("[data-awcd-videos-state]");
    const grid = videoRoot.querySelector("[data-awcd-video-grid]");
    observeOnce(videoRoot, async () => {
      state?.setAttribute("aria-busy", "true");
      try {
        const response = await fetch("/data/videos.json", { cache: "force-cache" });
        if (!response.ok) throw new Error(`Videos HTTP ${response.status}`);
        const data = await response.json();
        const videos = data.filter((video) => Array.isArray(video.characters) && video.characters.includes(characterId));
        const fragment = document.createDocumentFragment();
        videos.forEach((video, index) => {
          const id = youtubeId(video.url);
          if (!id) return;
          const link = document.createElement("a");
          link.className = "awcd-video-card";
          link.href = video.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          const image = document.createElement("img");
          image.src = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
          image.alt = "";
          image.width = 480;
          image.height = 360;
          image.loading = "lazy";
          image.decoding = "async";
          const label = document.createElement("span");
          label.textContent = `${strings.video} ${index + 1}`;
          link.append(image, label);
          fragment.append(link);
        });
        grid?.replaceChildren(fragment);
        state?.remove();
      } catch (error) {
        console.warn("[aw-character-detail] videos failed", error);
        if (state) state.textContent = strings.videosError;
      } finally {
        state?.removeAttribute("aria-busy");
      }
    }, "500px 0px");
  }

  function initSectionNavigation() {
    const nav = document.querySelector(".awcd-section-nav");
    if (!nav) return;
    const links = new Map([...nav.querySelectorAll("a[href^='#']")].map((link) => [link.hash.slice(1), link]));
    const entries = [...links].map(([id, link]) => ({ id, link, section: document.getElementById(id) })).filter((entry) => entry.section);
    if (!entries.length) return;
    let activeId = "";
    let updateFrame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function setActiveSection(id) {
      if (!links.has(id) || activeId === id) return;
      activeId = id;
      links.forEach((link, id) => {
        const isCurrent = id === activeId;
        link.classList.toggle("is-active", isCurrent);
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      const activeLink = links.get(activeId);
      const track = nav.firstElementChild;
      if (activeLink && track) {
        const linkRect = activeLink.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        if (linkRect.left < trackRect.left || linkRect.right > trackRect.right) {
          activeLink.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
        }
      }
    }

    function updateActiveSection() {
      updateFrame = 0;
      const navRect = nav.getBoundingClientRect();
      const activationLine = Math.min(window.innerHeight - 1, Math.max(0, navRect.bottom + 24));
      let current = entries[0];
      for (const entry of entries) {
        if (entry.section.getBoundingClientRect().top > activationLine + 1) break;
        current = entry;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = entries[entries.length - 1];
      setActiveSection(current.id);
    }

    function queueUpdate() {
      if (updateFrame) return;
      updateFrame = window.requestAnimationFrame(updateActiveSection);
    }

    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (link && nav.contains(link)) setActiveSection(link.hash.slice(1));
    });
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("hashchange", queueUpdate);
    window.addEventListener("load", queueUpdate, { once: true });
    const content = document.querySelector(".awcd-content");
    if (content && "ResizeObserver" in window) new ResizeObserver(queueUpdate).observe(content);
    queueUpdate();
  }

  function initCardDisclosures() {
    const mobile = window.matchMedia("(max-width: 720px)");
    let compact = false;
    let printing = false;
    const cards = [...document.querySelectorAll(".awcd-talent-card, .awcd-sequence-card")].map((card) => {
      const header = card.querySelector(":scope > header");
      if (!header) return null;
      const details = document.createElement("details");
      details.className = "awcd-card-details";
      const summary = document.createElement("summary");
      const content = document.createElement("div");
      content.className = "awcd-card-details-content";
      // Move the original nodes so glossary targets and multiplier controls retain their identity.
      while (header.nextSibling) content.append(header.nextSibling);
      details.append(summary, content);
      card.append(details);
      const entry = { card, details, summary, content, header, expanded: false };
      const updateLabel = () => {
        const label = details.open ? strings.hideDetails : strings.showDetails;
        summary.textContent = label;
        summary.setAttribute("aria-label", `${label}: ${header.querySelector("h3")?.textContent || ""}`);
      };
      details.addEventListener("toggle", () => {
        if (compact) entry.expanded = details.open;
        updateLabel();
      });
      updateLabel();
      return entry;
    }).filter(Boolean);

    function syncLayout() {
      const nextCompact = mobile.matches && !printing;
      const focusedElement = document.activeElement;
      for (const entry of cards) {
        const contentHasFocus = entry.card.contains(focusedElement)
          && !entry.header.contains(focusedElement) && focusedElement !== entry.summary;
        if (compact) entry.expanded = entry.details.open;
        if (!nextCompact && entry.summary === document.activeElement) {
          const heading = entry.header.querySelector("h3");
          if (heading) {
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
            heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
          }
        }
        if (nextCompact) {
          if (!entry.details.isConnected) {
            while (entry.header.nextSibling) entry.content.append(entry.header.nextSibling);
            entry.card.append(entry.details);
          }
          // Do not hide a focused control when a desktop window becomes narrow.
          if (contentHasFocus) entry.expanded = true;
          entry.details.open = entry.expanded;
        } else {
          // Restore the original flex/grid children on desktop and when printing.
          while (entry.content.firstChild) entry.card.insertBefore(entry.content.firstChild, entry.details);
          entry.details.remove();
        }
        if (contentHasFocus && document.activeElement !== focusedElement) focusedElement.focus({ preventScroll: true });
      }
      compact = nextCompact;
    }

    function revealHashTarget() {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const target = id && document.getElementById(id);
      const entry = target && cards.find(({ card, header }) => card.contains(target) && !header.contains(target));
      if (!entry) return;
      entry.expanded = true;
      // Open nested multiplier disclosures too if a link points inside one.
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === "DETAILS") parent.open = true;
      }
      target.scrollIntoView({ block: "start" });
    }

    syncLayout();
    revealHashTarget();
    mobile.addEventListener("change", syncLayout);
    window.addEventListener("hashchange", revealHashTarget);
    window.addEventListener("beforeprint", () => { printing = true; syncLayout(); });
    window.addEventListener("afterprint", () => { printing = false; syncLayout(); });
  }

  initCardDisclosures();
  initStats();
  initGlossary();
  initMultipliers();
  initLikes();
  initShareLoader();
  initTeamsLoader();
  initSynergiesLoader();
  initVideos();
  initSectionNavigation();
})();
