(function () {
  "use strict";

  /** @typedef {{ displayName: string, role: string, date: string, category: string, points: number, photoUrl?: string, activityTitle?: string }} RawActivity */
  /** @typedef {{ date: string, category: string, points: number, activityTitle: string }} Activity */
  /** @typedef {{ rank: number, displayName: string, role: string, totalScore: number, categoryEventCounts: Record<string, number>, activities: Activity[], photoUrl: string }} PersonRow */

  function parseISODate(s) {
    var d = new Date(s + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function quarterOf(d) {
    return Math.trunc(d.getMonth() / 3) + 1;
  }

  function normalizeName(name) {
    if (!name || typeof name !== "string") return "";
    return name.trim().toLowerCase();
  }

  /**
   * @param {RawActivity[]} raw
   * @param {{ year: string, quarter: string, category: string, searchTerm: string }} filters
   * @returns {PersonRow[]}
   */
  function buildLeaderboard(raw, filters) {
    var year = filters.year;
    var quarter = filters.quarter;
    var category = filters.category;

    var filtered = raw.filter(function (a) {
      var d = parseISODate(a.date);
      if (!d) return false;
      if (year && String(d.getFullYear()) !== year) return false;
      if (quarter && String(quarterOf(d)) !== quarter) return false;
      if (category && a.category !== category) return false;
      return true;
    });

    var byKey = new Map();
    filtered.forEach(function (a) {
      var key = normalizeName(a.displayName) || "unknown";
      if (!byKey.has(key)) {
        byKey.set(key, {
          displayName: a.displayName,
          role: a.role,
          activities: [],
          photoUrl: typeof a.photoUrl === "string" && a.photoUrl.trim() ? a.photoUrl.trim() : "",
        });
      }
      var row = byKey.get(key);
      if (a.role) row.role = a.role;
      if (typeof a.photoUrl === "string" && a.photoUrl.trim() && !row.photoUrl) {
        row.photoUrl = a.photoUrl.trim();
      }
      row.activities.push({
        date: a.date,
        category: a.category,
        points: a.points,
        activityTitle: typeof a.activityTitle === "string" && a.activityTitle.trim() ? a.activityTitle.trim() : "",
      });
    });

    /** @type {PersonRow[]} */
    var merged = [];
    byKey.forEach(function (entry) {
      var total = entry.activities.reduce(function (s, x) {
        return s + x.points;
      }, 0);
      /* Число під іконкою категорії — кількість подій (активностей), не сума XP */
      var eventCounts = {};
      entry.activities.forEach(function (x) {
        eventCounts[x.category] = (eventCounts[x.category] || 0) + 1;
      });
      var acts = entry.activities.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date);
      });
      merged.push({
        rank: 0,
        displayName: entry.displayName,
        role: entry.role || "",
        totalScore: total,
        categoryEventCounts: eventCounts,
        activities: acts,
        photoUrl: entry.photoUrl || "",
      });
    });

    merged.sort(function (a, b) {
      return b.totalScore - a.totalScore;
    });

    var term = (filters.searchTerm || "").trim().toLowerCase();
    var out = merged;
    if (term) {
      var parts = term.split(/\s+/).filter(Boolean);
      out = merged.filter(function (r) {
        var name = r.displayName.toLowerCase();
        var role = (r.role || "").toLowerCase();
        return parts.every(function (p) {
          return name.includes(p) || role.includes(p);
        });
      });
    }
    out.forEach(function (r, i) {
      r.rank = i + 1;
    });
    return out;
  }

  function initials(name) {
    var parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name.slice(0, 2) || "?").toUpperCase();
  }

  function hashHue(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  /**
   * Иконка как Fluent Star 16 Filled (@fluentui/svg-icons / shadcn-реестр fluent:star-16-filled).
   * Файл-копия: assets/icons/fluent/star-16-filled.svg — статическая страница без React.
   */
  var FLUENT_STAR_16 =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" focusable="false" aria-hidden="true"><path d="M7.2 2.1a.9.9 0 0 1 1.6 0l1.53 3.08 3.4.5a.9.9 0 0 1 .5 1.53l-2.46 2.4.58 3.39a.9.9 0 0 1-1.3.95L8 12.35l-3.04 1.6a.9.9 0 0 1-1.3-.95l.57-3.39-2.46-2.4a.9.9 0 0 1 .5-1.53l3.4-.5L7.2 2.1Z"/></svg>';

  /** Fluent Info 20 Regular — як у SharePoint MessageBar (data-icon-name="Info"). */
  /** Вивід 16×16 — як Fluent MDL2 Info у DevTools. */
  var FLUENT_INFO_20 =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.25" d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z"/><path d="M9.25 5.9h1.4v1.4H9.25V5.9zm0 3.1h1.4v5.2H9.25V9z"/></svg>';

  var FLUENT_CHEVRON_DOWN_20 =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true"><path d="M15.85 7.65c.2.2.2.5 0 .7l-5.46 5.49a.55.55 0 01-.78 0L4.15 8.35a.5.5 0 01.7-.7L10 12.21l5.15-5.56a.5.5 0 01.7.01z"/></svg>';
  /* Рядок згорнутий — ChevronDown; розгорнутий — ChevronUp (той самий path, rotate 180° по центру viewBox). */
  var EXPAND_BTN_HTML_ROW_COLLAPSED =
    '<i data-icon-name="ChevronDown" class="expand-button-icon" aria-hidden="true">' + FLUENT_CHEVRON_DOWN_20 + "</i>";
  var EXPAND_BTN_HTML_ROW_EXPANDED =
    '<i data-icon-name="ChevronUp" class="expand-button-icon" aria-hidden="true">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true"><g transform="rotate(180 10 10)"><path d="M15.85 7.65c.2.2.2.5 0 .7l-5.46 5.49a.55.55 0 01-.78 0L4.15 8.35a.5.5 0 01.7-.7L10 12.21l5.15-5.56a.5.5 0 01.7.01z"/></g></svg></i>';

  function appendFavoriteStarScore(container, totalScore) {
    var icon = document.createElement("i");
    icon.className = "podium-score-icon";
    icon.setAttribute("data-icon-name", "FavoriteStarFill");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = FLUENT_STAR_16;
    container.appendChild(icon);
    container.appendChild(el("span", "podium-score-value", String(totalScore)));
  }

  /** Счёт в строке списка — та же звезда Fluent 16, классы как у SharePoint `.score` */
  function appendListRowScore(scoreEl, totalScore) {
    var icon = document.createElement("i");
    icon.className = "list-score-icon";
    icon.setAttribute("data-icon-name", "FavoriteStarFill");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = FLUENT_STAR_16;
    scoreEl.appendChild(icon);
    var val = document.createElement("span");
    val.textContent = String(totalScore);
    scoreEl.appendChild(val);
  }

  /**
   * Іконки рядка категорій. Public Speaking — той самий SVG, що в SharePoint (viewBox 2048, path з Office/Fluent).
   * Education: HatGraduation20Regular. University Partnership: Emoji (SVG viewBox 2048, emoji-2048.svg).
   * @param {string} category
   * @returns {{ svg: string, label: string, iconName: string }}
   */
  function categoryListStatIcon(category) {
    if (category === "Education") {
      return {
        label: "Education",
        iconName: "HatGraduation",
        svg:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true"><path fill="currentColor" d="M8.5 3.4a3 3 0 0 1 3 0l7.25 4.17a.5.5 0 0 1 0 .86L16 10.01v4.49a.5.5 0 0 1-.15.35v.01l-.03.03a3.61 3.61 0 0 1-.38.32A9.1 9.1 0 0 1 10 17a9.1 9.1 0 0 1-5.74-2.05 3.56 3.56 0 0 1-.08-.07.53.53 0 0 1-.18-.4v-4.48L2 8.86v4.64a.5.5 0 0 1-1 0V8c0-.19.1-.35.26-.44L8.51 3.4Zm3 9.2a3 3 0 0 1-3 0L5 10.59v3.69l.17.14A8.1 8.1 0 0 0 10 16a8.1 8.1 0 0 0 5-1.72v-3.7l-3.5 2.02ZM11 4.27a2 2 0 0 0-2 0L2.5 8 9 11.73a2 2 0 0 0 2 0L17.5 8 11 4.27Z"/></svg>',
      };
    }
    if (category === "Public Speaking") {
      return {
        label: "Public Speaking",
        iconName: "Presentation",
        svg:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" fill="currentColor" focusable="false" aria-hidden="true"><path fill="currentColor" d="M0 0h1920v128h-128v896q0 26-10 49t-27 41t-41 28t-50 10h-640v640h512v128H384v-128h512v-640H256q-26 0-49-10t-41-27t-28-41t-10-50V128H0zm1664 1024V128H256v896zm-256-512v128H512V512z"/></svg>',
      };
    }
    if (category === "University Partnership") {
      return {
        label: "University Partnership",
        iconName: "Emoji",
        svg:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" fill="currentColor" focusable="false" aria-hidden="true"><path fill="currentColor" d="M640 896q-27 0-50-10t-40-27t-28-41t-10-50q0-27 10-50t27-40t41-28t50-10q27 0 50 10t40 27t28 41t10 50q0 27-10 50t-27 40t-41 28t-50 10m768 0q-27 0-50-10t-40-27t-28-41t-10-50q0-27 10-50t27-40t41-28t50-10q27 0 50 10t40 27t28 41t10 50q0 27-10 50t-27 40t-41 28t-50 10M1024 0q141 0 272 36t245 103t207 160t160 208t103 245t37 272q0 141-36 272t-103 245t-160 207t-208 160t-245 103t-272 37q-141 0-272-36t-245-103t-207-160t-160-208t-103-244t-37-273q0-141 36-272t103-245t160-207t208-160T751 37t273-37m0 1920q123 0 237-32t214-90t182-141t140-181t91-214t32-238q0-123-32-237t-90-214t-141-182t-181-140t-214-91t-238-32q-123 0-237 32t-214 90t-182 141t-140 181t-91 214t-32 238q0 123 32 237t90 214t141 182t181 140t214 91t238 32m0-384q73 0 141-20t128-57t106-90t81-118l115 58q-41 81-101 147t-134 112t-159 71t-177 25t-177-25t-159-71t-134-112t-101-147l115-58q33 65 80 118t107 90t127 57t142 20"/></svg>',
      };
    }
    return {
      label: category,
      iconName: "CircleHint",
      svg:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" focusable="false" aria-hidden="true"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 3v5H6V9h3V5h2z"/></svg>',
    };
  }

  var CATEGORY_LIST_ORDER = ["Education", "Public Speaking", "University Partnership"];

  /** SharePoint: 17-Dec-2025 */
  function formatActivityDateSharePoint(isoDate) {
    var d = parseISODate(isoDate);
    if (!d) return isoDate;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return d.getDate() + "-" + months[d.getMonth()] + "-" + d.getFullYear();
  }

  function activityRowDisplayTitle(act) {
    if (act.activityTitle) return act.activityTitle;
    return "Contribution — " + act.category;
  }

  function categoryBadgeClassNames() {
    /* SharePoint: один стиль categoryBadge + categoryDefault для всіх категорій */
    return "category-badge category-default";
  }

  function formatActivityPointsCell(points) {
    if (points > 0) return "+" + String(points);
    return String(points);
  }

  /** @param {Record<string, number>} countsPerCategory — для рядка списку: кількість подій на категорію */
  function sortedCategoriesForList(countsPerCategory) {
    var keys = Object.keys(countsPerCategory || {});
    return keys.sort(function (a, b) {
      var ia = CATEGORY_LIST_ORDER.indexOf(a);
      var ib = CATEGORY_LIST_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
  }

  /**
   * @param {PersonRow[]} rows — поточний список (з пошуком); топ-3 з нього у слотах ліво / центр / право.
   * @param {Map<string, number>} globalRankMap — місце 1…N у рейтингу **без** пошуку (ті самі фільтри рік/квартал/категорія), за ключем normalizeName.
   */
  function renderPodium(container, rows, globalRankMap) {
    container.innerHTML = "";
    var top = rows.slice(0, 3);
    var slotDefs = [
      { idx: 1, slotClass: "podium-slot-left" },
      { idx: 0, slotClass: "podium-slot-center" },
      { idx: 2, slotClass: "podium-slot-right" },
    ];
    function tierNumFromStanding(s) {
      if (s <= 1) return 1;
      if (s === 2) return 2;
      return 3;
    }
    slotDefs.forEach(function (def) {
      var col = el("div", "podium-column " + def.slotClass);
      var person = top[def.idx];
      if (!person) {
        col.classList.add("podium-column--empty");
        col.setAttribute("aria-hidden", "true");
        container.appendChild(col);
        return;
      }
      var key = normalizeName(person.displayName);
      var standing = globalRankMap.has(key) ? globalRankMap.get(key) : person.rank;
      var tierCls = "podium-s-" + tierNumFromStanding(standing);

      var tierWrap = el("div", tierCls);
      var user = el("div", "podium-user");
      var avContainer = el("div", "podium-avatar-container");
      var av = el("div", "podium-avatar");
      if (standing === 1) {
        av.classList.add("podium-avatar--first");
      }
      if (person.photoUrl && (/^https?:\/\//i.test(person.photoUrl) || person.photoUrl.startsWith("/"))) {
        av.classList.add("podium-avatar--photo");
        var safeUrl = person.photoUrl.replace(/"/g, "");
        av.style.backgroundImage = 'url("' + safeUrl + '")';
        av.textContent = "";
      } else {
        av.textContent = initials(person.displayName);
      }
      avContainer.appendChild(av);
      avContainer.appendChild(el("div", "podium-rank-badge", String(standing)));
      user.appendChild(avContainer);

      var nameEl = document.createElement("h3");
      nameEl.className = "podium-name";
      nameEl.textContent = person.displayName;
      user.appendChild(nameEl);

      var roleEl = document.createElement("p");
      roleEl.className = "podium-role";
      roleEl.textContent = person.role || "—";
      user.appendChild(roleEl);

      var scoreWrap = el("div", "podium-score");
      var scoreMod = standing === 1 ? "podium-score--gold" : "podium-score--blue";
      scoreWrap.className = "podium-score " + scoreMod;
      appendFavoriteStarScore(scoreWrap, person.totalScore);
      user.appendChild(scoreWrap);

      var block = el("div", "podium-block");
      block.appendChild(el("div", "podium-block-top"));
      block.appendChild(el("span", "podium-rank-number", String(standing)));

      tierWrap.appendChild(user);
      tierWrap.appendChild(block);
      col.appendChild(tierWrap);
      container.appendChild(col);
    });
  }

  /** Порожній стан у стилі Fluent MessageBar (SharePoint). */
  function createEmptyStateMessageBar() {
    var root = el("div", "ms-MessageBar leaderboard-empty-message-bar");
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");

    var iconWrap = el("div", "ms-MessageBar-icon leaderboard-empty-message-bar-icon");
    iconWrap.setAttribute("aria-hidden", "true");
    var icon = document.createElement("i");
    icon.className = "leaderboard-empty-message-bar-icon-glyph";
    icon.setAttribute("data-icon-name", "Info");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = FLUENT_INFO_20;
    iconWrap.appendChild(icon);

    var textWrap = el("div", "ms-MessageBar-text leaderboard-empty-message-bar-text");
    var inner = el("span", "ms-MessageBar-innerText leaderboard-empty-message-bar-inner");
    inner.appendChild(el("span", null, "No activities found matching the current filters."));
    textWrap.appendChild(inner);

    root.appendChild(iconWrap);
    root.appendChild(textWrap);
    return root;
  }

  function renderList(container, rows, globalRankMap) {
    container.innerHTML = "";
    if (!rows.length) {
      container.appendChild(createEmptyStateMessageBar());
      return;
    }
    rows.forEach(function (person) {
      /* SharePoint: list → userRowContainer → row → rowMain / rowDetail */
      var shell = el("div", "user-row-container");
      var row = el("div", "row");
      var main = el("div", "row-main");
      var left = el("div", "row-left");
      var listKey = normalizeName(person.displayName);
      var listRank = globalRankMap.has(listKey) ? globalRankMap.get(listKey) : person.rank;
      left.appendChild(el("span", "rank", String(listRank)));
      var av = el("div", "avatar");
      if (person.photoUrl && (/^https?:\/\//i.test(person.photoUrl) || person.photoUrl.startsWith("/"))) {
        av.classList.add("avatar--photo");
        av.style.backgroundImage = 'url("' + person.photoUrl.replace(/"/g, "") + '")';
        av.textContent = "";
      } else {
        av.style.background = "linear-gradient(135deg, hsl(" + hashHue(person.displayName) + ",50%,42%), hsl(" + (hashHue(person.displayName) + 50) % 360 + ",45%,32%))";
        av.textContent = initials(person.displayName);
      }
      left.appendChild(av);
      var info = el("div", "info");
      var nameEl = el("h3", "name", person.displayName);
      var roleEl = el("span", "role", person.role || "—");
      info.appendChild(nameEl);
      info.appendChild(roleEl);
      left.appendChild(info);
      main.appendChild(left);

      var right = el("div", "row-right");
      var catStats = el("div", "category-stats");
      sortedCategoriesForList(person.categoryEventCounts).forEach(function (cat) {
        var eventCount = person.categoryEventCounts[cat];
        if (!eventCount) return;
        var meta = categoryListStatIcon(cat);
        var wrap = el("div", "category-stat-wrap fluent-tooltip-host");
        if (cat === "Education") wrap.classList.add("category-stat-wrap--education");
        wrap.setAttribute("role", "group");
        wrap.setAttribute("data-tooltip", meta.label);
        var stat = el("div", "category-stat");
        var ic = document.createElement("i");
        ic.className = "category-stat-icon";
        ic.setAttribute("aria-hidden", "true");
        ic.setAttribute("data-icon-name", meta.iconName);
        ic.innerHTML = meta.svg;
        stat.appendChild(ic);
        stat.appendChild(el("span", "category-stat-count", String(eventCount)));
        wrap.appendChild(stat);
        var sr = el("span", "visually-hidden", meta.label + ": " + eventCount + " events");
        wrap.appendChild(sr);
        catStats.appendChild(wrap);
      });
      if (!catStats.childNodes.length) {
        catStats.appendChild(el("span", "category-stats-empty", "—"));
      }
      right.appendChild(catStats);

      var totalSec = el("div", "total-section");
      totalSec.appendChild(el("span", "total-label", "TOTAL"));
      var scoreBox = el("div", "score");
      appendListRowScore(scoreBox, person.totalScore);
      totalSec.appendChild(scoreBox);
      right.appendChild(totalSec);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "expand-button";
      btn.setAttribute("aria-label", "Expand");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = EXPAND_BTN_HTML_ROW_COLLAPSED;
      right.appendChild(btn);
      main.appendChild(right);
      row.appendChild(main);

      var detail = el("div", "row-detail");
      detail.hidden = true;
      /* SharePoint: .details > .detailsTitle + .tableWrapper > .activityTable */
      var detailsInner = el("div", "details");
      detailsInner.appendChild(el("h4", "details-title", "RECENT ACTIVITY"));
      var wrap = el("div", "table-wrapper");
      var tbl = el("table", "activity-table");
      var thead = document.createElement("thead");
      var hr = document.createElement("tr");
      ["Activity", "Category", "Date", "Points"].forEach(function (h) {
        hr.appendChild(el("th", null, h));
      });
      thead.appendChild(hr);
      tbl.appendChild(thead);
      var tb = document.createElement("tbody");
      person.activities.forEach(function (a) {
        var tr = document.createElement("tr");
        var tdName = el("td", "activity-name", activityRowDisplayTitle(a));
        var tdCat = document.createElement("td");
        tdCat.className = "activity-category";
        var badge = document.createElement("span");
        badge.className = categoryBadgeClassNames();
        badge.textContent = a.category;
        tdCat.appendChild(badge);
        tr.appendChild(tdName);
        tr.appendChild(tdCat);
        tr.appendChild(el("td", "activity-date", formatActivityDateSharePoint(a.date)));
        tr.appendChild(el("td", "activity-points", formatActivityPointsCell(a.points)));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      wrap.appendChild(tbl);
      detailsInner.appendChild(wrap);
      detail.appendChild(detailsInner);
      row.appendChild(detail);
      shell.appendChild(row);

      btn.addEventListener("click", function () {
        var open = detail.hidden;
        if (open) {
          /* Одночасно лише один розкритий рядок — згорнути інші в цьому списку */
          var siblings = container.querySelectorAll(".user-row-container");
          for (var si = 0; si < siblings.length; si++) {
            var other = siblings[si];
            if (other === shell) continue;
            var od = other.querySelector(".row-detail");
            var ob = other.querySelector(".expand-button");
            if (!od || !ob || od.hidden) continue;
            od.hidden = true;
            ob.setAttribute("aria-expanded", "false");
            ob.setAttribute("aria-label", "Expand");
            other.classList.remove("expanded");
            ob.classList.remove("expand-button--open");
            ob.innerHTML = EXPAND_BTN_HTML_ROW_COLLAPSED;
          }
        }
        detail.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Collapse" : "Expand");
        shell.classList.toggle("expanded", open);
        btn.classList.toggle("expand-button--open", open);
        btn.innerHTML = open ? EXPAND_BTN_HTML_ROW_EXPANDED : EXPAND_BTN_HTML_ROW_COLLAPSED;
      });

      container.appendChild(shell);
    });
  }

  function uniqueYears(raw) {
    var ys = {};
    raw.forEach(function (a) {
      var d = parseISODate(a.date);
      if (d) ys[String(d.getFullYear())] = true;
    });
    return Object.keys(ys).sort().reverse();
  }

  function uniqueCategories(raw) {
    var c = {};
    raw.forEach(function (a) {
      c[a.category] = true;
    });
    return Object.keys(c).sort();
  }

  function readFilters() {
    return {
      year: document.getElementById("filter-year").value,
      quarter: document.getElementById("filter-quarter").value,
      category: document.getElementById("filter-category").value,
      searchTerm: document.getElementById("filter-search").value,
    };
  }

  /**
   * Fluent-style Dropdown: combobox + Callout listbox (как ms-Dropdown-items в SharePoint).
   * @param {{ hiddenId: string, comboboxId: string, titleId: string, calloutId: string, listId: string, getOptions: () => { value: string, label: string }[] }} cfg
   */
  function wireFluentDropdown(cfg) {
    var hidden = document.getElementById(cfg.hiddenId);
    var combobox = document.getElementById(cfg.comboboxId);
    var title = document.getElementById(cfg.titleId);
    var callout = document.getElementById(cfg.calloutId);
    var list = document.getElementById(cfg.listId);
    var container = combobox.closest(".ms-Dropdown-container");

    function setOpen(open) {
      if (open) {
        callout.hidden = false;
        combobox.setAttribute("aria-expanded", "true");
        container.classList.add("is-open");
        requestAnimationFrame(function () {
          var sel = list.querySelector(".ms-Dropdown-item--selected");
          var first = list.querySelector(".ms-Dropdown-item");
          var el = sel || first;
          if (el) el.focus();
        });
      } else {
        callout.hidden = true;
        combobox.setAttribute("aria-expanded", "false");
        container.classList.remove("is-open");
        requestAnimationFrame(function () {
          combobox.focus();
        });
      }
    }

    function isOpen() {
      return container.classList.contains("is-open");
    }

    function renderOptions() {
      var optDefs = cfg.getOptions();
      var keys = optDefs.map(function (o) {
        return String(o.value);
      });
      if (keys.indexOf(String(hidden.value)) < 0) {
        hidden.value = "";
      }
      var current = String(hidden.value);
      list.innerHTML = "";
      var n = optDefs.length;
      optDefs.forEach(function (opt, i) {
        var selected = String(opt.value) === current;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.id = cfg.listId + "-item-" + i;
        btn.className =
          "ms-Button ms-Button--action ms-Button--command ms-Dropdown-item" +
          (selected ? " ms-Dropdown-item--selected" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", selected ? "true" : "false");
        btn.setAttribute("aria-posinset", String(i + 1));
        btn.setAttribute("aria-setsize", String(n));
        btn.setAttribute("data-index", String(i));
        btn.setAttribute("data-is-focusable", "true");
        btn.tabIndex = selected ? 0 : -1;
        btn.dataset.value = opt.value;
        var flex = document.createElement("span");
        flex.className = "ms-Button-flexContainer";
        flex.setAttribute("data-automationid", "splitbuttonprimary");
        var text = document.createElement("span");
        text.className = "ms-Dropdown-optionText";
        text.textContent = opt.label;
        flex.appendChild(text);
        btn.appendChild(flex);
        btn.addEventListener("click", function (ev) {
          ev.preventDefault();
          hidden.value = opt.value;
          title.textContent = opt.label;
          setOpen(false);
          renderOptions();
          refresh();
        });
        list.appendChild(btn);
      });
      var lab = "";
      for (var j = 0; j < optDefs.length; j++) {
        if (String(optDefs[j].value) === current) {
          lab = optDefs[j].label;
          break;
        }
      }
      title.textContent = lab || (optDefs[0] && optDefs[0].label) || "";
    }

    combobox.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = !isOpen();
      if (willOpen) {
        document.querySelectorAll(".ms-Dropdown-container.is-open").forEach(function (c) {
          if (c !== container) {
            var cb = c.querySelector(".ms-Dropdown-trigger");
            var co = c.querySelector(".ms-Dropdown-callout");
            if (co) co.hidden = true;
            if (cb) cb.setAttribute("aria-expanded", "false");
            c.classList.remove("is-open");
          }
        });
      }
      setOpen(willOpen);
    });

    combobox.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && isOpen()) {
        ev.preventDefault();
        setOpen(false);
        return;
      }
      if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ") {
        if (!isOpen()) {
          ev.preventDefault();
          setOpen(true);
        }
      }
    });

    list.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        ev.preventDefault();
        setOpen(false);
        combobox.focus();
        return;
      }
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        var items = Array.prototype.slice.call(list.querySelectorAll(".ms-Dropdown-item"));
        var ix = items.indexOf(document.activeElement);
        if (ix < 0) ix = 0;
        var next =
          ev.key === "ArrowDown" ? Math.min(items.length - 1, ix + 1) : Math.max(0, ix - 1);
        if (items[next]) items[next].focus();
      }
      if (ev.key === "Enter") {
        var active = document.activeElement;
        if (active && active.classList && active.classList.contains("ms-Dropdown-item")) {
          ev.preventDefault();
          active.click();
        }
      }
    });

    renderOptions();

    return {
      rebuild: renderOptions,
      close: function () {
        setOpen(false);
      },
    };
  }

  function bindGlobalDropdownDismiss() {
    if (bindGlobalDropdownDismiss.done) return;
    bindGlobalDropdownDismiss.done = true;
    document.addEventListener(
      "mousedown",
      function (ev) {
        document.querySelectorAll(".ms-Dropdown-container.is-open").forEach(function (c) {
          if (!c.contains(ev.target)) {
            var cb = c.querySelector(".ms-Dropdown-trigger");
            var co = c.querySelector(".ms-Dropdown-callout");
            if (co) co.hidden = true;
            if (cb) cb.setAttribute("aria-expanded", "false");
            c.classList.remove("is-open");
            if (cb) cb.focus();
          }
        });
      },
      true
    );
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      document.querySelectorAll(".ms-Dropdown-container.is-open").forEach(function (c) {
        var cb = c.querySelector(".ms-Dropdown-trigger");
        var co = c.querySelector(".ms-Dropdown-callout");
        if (co) co.hidden = true;
        if (cb) cb.setAttribute("aria-expanded", "false");
        c.classList.remove("is-open");
        if (cb) cb.focus();
      });
    });
  }

  function refresh() {
    var raw = window.LEADERBOARD_RAW_ACTIVITIES || [];
    var filters = readFilters();
    var standingsNoSearch = buildLeaderboard(raw, {
      year: filters.year,
      quarter: filters.quarter,
      category: filters.category,
      searchTerm: "",
    });
    var globalRankMap = new Map();
    standingsNoSearch.forEach(function (r) {
      globalRankMap.set(normalizeName(r.displayName), r.rank);
    });
    var rows = buildLeaderboard(raw, filters);
    var podiumEl = document.getElementById("podium");
    renderPodium(podiumEl, rows, globalRankMap);
    podiumEl.hidden = rows.length === 0;
    renderList(document.getElementById("list"), rows, globalRankMap);
  }

  function init() {
    var raw = window.LEADERBOARD_RAW_ACTIVITIES || [];

    bindGlobalDropdownDismiss();

    wireFluentDropdown({
      hiddenId: "filter-year",
      comboboxId: "filter-year-combobox",
      titleId: "filter-year-title",
      calloutId: "filter-year-callout",
      listId: "filter-year-list",
      getOptions: function () {
        var ys = uniqueYears(window.LEADERBOARD_RAW_ACTIVITIES || []);
        var opts = [{ value: "", label: "All Years" }];
        ys.forEach(function (y) {
          opts.push({ value: y, label: y });
        });
        return opts;
      },
    });

    wireFluentDropdown({
      hiddenId: "filter-quarter",
      comboboxId: "filter-quarter-combobox",
      titleId: "filter-quarter-title",
      calloutId: "filter-quarter-callout",
      listId: "filter-quarter-list",
      getOptions: function () {
        var opts = [{ value: "", label: "All Quarters" }];
        for (var q = 1; q <= 4; q++) {
          opts.push({ value: String(q), label: "Q" + q });
        }
        return opts;
      },
    });

    wireFluentDropdown({
      hiddenId: "filter-category",
      comboboxId: "filter-category-combobox",
      titleId: "filter-category-title",
      calloutId: "filter-category-callout",
      listId: "filter-category-list",
      getOptions: function () {
        var cats = uniqueCategories(window.LEADERBOARD_RAW_ACTIVITIES || []);
        var opts = [{ value: "", label: "All Categories" }];
        cats.forEach(function (c) {
          opts.push({ value: c, label: c });
        });
        return opts;
      },
    });

    var search = document.getElementById("filter-search");
    var clearBtn = document.getElementById("filter-search-clear");
    var t;

    function updateSearchClearVisibility() {
      if (clearBtn && search) {
        clearBtn.hidden = !String(search.value || "").trim();
      }
    }

    search.addEventListener("input", function () {
      updateSearchClearVisibility();
      clearTimeout(t);
      t = setTimeout(refresh, 200);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        search.value = "";
        updateSearchClearVisibility();
        clearTimeout(t);
        refresh();
        search.focus();
      });
    }

    updateSearchClearVisibility();
    refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
