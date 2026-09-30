// YTDescGen moved from poli0981.github.io/youtube-generator to
// ytgenerator.stream. Browser storage belongs to a site, so data saved on the
// old address can't follow on its own: this page reads it and hands it over
// as a backup file (the format the new site's Settings › Restore reads).
(function () {
  "use strict";

  // Store key, where a list section keeps its items, and the backup section.
  var STORES = [
    { key: "ytdescgen-profiles", section: "profiles", list: "profiles" },
    { key: "ytdescgen-presets", section: "presets", list: "presets" },
    { key: "ytdescgen-templates", section: "templates", list: "templates" },
    { key: "ytdescgen-history", section: "history", list: "entries" },
    { key: "ytdescgen-settings", section: "settings", list: null },
    { key: "ytdescgen-editor-draft", section: "draft", list: null },
  ];

  var TEXT = {
    en: {
      title: "YTDescGen has moved to ytgenerator.stream",
      lead: "The app now lives at its own address. Everything you saved on this old address — profiles, presets, templates, history, settings — stays in this browser, so bring it along in two steps.",
      step1: "Download your data",
      searching: "Looking for saved data…",
      found: "Found: {list}.",
      none: "Nothing was saved in this browser — you can go straight to the new site.",
      unavailable:
        "This browser won't let the page read its storage (private mode?). Open the page in the browser you used before.",
      download: "Download my data",
      step2: "Restore it on the new site",
      step2Hint:
        "Open Settings › Backup & restore, choose Restore and pick the file — or drop it there. You'll see what's new before anything changes.",
      open: "Open ytgenerator.stream",
      notice:
        "This page stays until 29 November 2026. The desktop and Android apps aren't affected.",
      switch: "Tiếng Việt",
      profiles: "Profiles ({n})",
      presets: "Game presets ({n})",
      templates: "Templates ({n})",
      history: "History ({n})",
      settings: "Settings",
      draft: "Editor draft",
    },
    vi: {
      title: "YTDescGen đã chuyển sang ytgenerator.stream",
      lead: "Ứng dụng giờ có địa chỉ riêng. Mọi thứ bạn đã lưu ở địa chỉ cũ này — hồ sơ, preset, template, lịch sử, cài đặt — vẫn nằm trong trình duyệt này, hãy mang theo bằng hai bước.",
      step1: "Tải dữ liệu của bạn",
      searching: "Đang tìm dữ liệu đã lưu…",
      found: "Tìm thấy: {list}.",
      none: "Trình duyệt này chưa lưu gì — bạn có thể sang thẳng trang mới.",
      unavailable:
        "Trình duyệt không cho trang đọc bộ nhớ (chế độ ẩn danh?). Hãy mở trang bằng trình duyệt bạn đã dùng trước đây.",
      download: "Tải dữ liệu của tôi",
      step2: "Khôi phục trên trang mới",
      step2Hint:
        "Mở Cài đặt › Sao lưu & khôi phục, chọn Khôi phục rồi chọn tệp — hoặc thả tệp vào đó. Bạn sẽ xem trước những gì mới trước khi có thay đổi nào.",
      open: "Mở ytgenerator.stream",
      notice:
        "Trang này tồn tại đến ngày 29/11/2026. Ứng dụng desktop và Android không bị ảnh hưởng.",
      switch: "English",
      profiles: "Hồ sơ ({n})",
      presets: "Preset game ({n})",
      templates: "Template ({n})",
      history: "Lịch sử ({n})",
      settings: "Cài đặt",
      draft: "Bản nháp editor",
    },
  };

  var lang = /^vi\b/i.test(navigator.language || "") ? "vi" : "en";
  var found = null; // { data, parts } once read
  var readFailed = false;

  function format(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, name) {
      return String(values[name]);
    });
  }

  function readStores() {
    var data = {};
    var parts = [];
    STORES.forEach(function (store) {
      var raw = localStorage.getItem(store.key);
      if (!raw) return;
      var saved;
      try {
        saved = JSON.parse(raw);
      } catch (e) {
        return;
      }
      // Zustand's saved shape: { state, version }.
      var state = saved && saved.state ? saved.state : saved;
      var version = saved && typeof saved.version === "number" ? saved.version : 0;
      if (!state || typeof state !== "object") return;
      if (store.list) {
        var items = state[store.list];
        if (!Array.isArray(items) || items.length === 0) return;
        data[store.section] = { version: version, items: items };
        parts.push({ section: store.section, n: items.length });
      } else {
        data[store.section] = { version: version, value: state };
        parts.push({ section: store.section, n: 1 });
      }
    });
    return { data: data, parts: parts };
  }

  function render() {
    var text = TEXT[lang];
    document.documentElement.lang = lang;
    document.title = text.title;
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var key = el.getAttribute("data-i18n");
      if (text[key] && key !== "searching") el.textContent = text[key];
    });
    var status = document.getElementById("found");
    var button = document.getElementById("download");
    if (readFailed) {
      status.textContent = text.unavailable;
      button.disabled = true;
    } else if (!found || found.parts.length === 0) {
      status.textContent = text.none;
      button.disabled = true;
    } else {
      var list = found.parts.map(function (part) {
        return format(text[part.section], { n: part.n });
      });
      status.textContent = format(text.found, { list: list.join(", ") });
      button.disabled = false;
    }
  }

  function download() {
    if (!found) return;
    var now = new Date();
    var envelope = {
      _app: "ytdescgen",
      _format: 2,
      _type: "backup",
      _schemaVersion: 1,
      _appVersion: "0.38.0",
      _exportedAt: now.toISOString(),
      _source: "poli0981.github.io/youtube-generator",
      data: found.data,
    };
    var blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var day = now.toISOString().slice(0, 10);
    link.href = url;
    link.download = "ytdescgen-legacy-backup-" + day + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      found = readStores();
    } catch (e) {
      readFailed = true;
    }
    document.getElementById("download").addEventListener("click", download);
    document.getElementById("language").addEventListener("click", function () {
      lang = lang === "vi" ? "en" : "vi";
      render();
    });
    render();
  });
})();
