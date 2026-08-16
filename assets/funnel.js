/* ================== CONFIG ================== */
var GA4_ID = "G-G176TZC8TC";
var EXIT_URL = "https://www.google.com";
var TOP_AD_PATH = "/23313830399/320x1005p";
var BOTTOM_AD_PATH = "/23313830399/300x250p";
var REWARD_AD_PATH = "/23313830399/reward";

/* ================== GA4 ================== */
/* Real page navigation = real pageviews. No pushState hack needed. */
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_ID);
})();

function trackDecline(stepName) {
  if (window.gtag) {
    gtag('event', 'page_view', {
      page_title: stepName + ' - Declined',
      page_path: location.pathname + '-declined',
      transport_type: 'beacon'
    });
  }
}

/* ================== GPT AD SLOTS ================== */
/* Each real page load = one clean, policy-compliant ad request per slot.
   No manual refresh() needed anymore — navigation IS the refresh. */
googletag.cmd.push(function () {
  var topSlot = googletag.defineSlot(TOP_AD_PATH, [320, 100], 'div-gpt-ad-top-320x100').addService(googletag.pubads());
  var bottomSlot = googletag.defineSlot(BOTTOM_AD_PATH, [300, 250], 'div-gpt-ad-bottom-300x250').addService(googletag.pubads());
  googletag.pubads().enableSingleRequest();
  googletag.enableServices();
  googletag.display('div-gpt-ad-top-320x100');
  googletag.display('div-gpt-ad-bottom-300x250');
});

/* ================== REWARDED AD (preload) ================== */
/* Call this on pages 1-4 so it has the whole journey to load in the
   background. By the time the visitor reaches video-playing, it's
   usually already to show instantly. */
var rewardedAdReady = false;
var rewardedAdRequested = false;
var rewardedAdEvent = null;
var rewardedAdEmpty = false;

function preloadRewardedAd() {
  if (rewardedAdRequested) { return; }
  rewardedAdRequested = true;

  var last = localStorage.getItem("hasShownRewardedAd");
  var now = Date.now();
  if (last && (now - parseInt(last, 10) <= 6e5)) {
    return; // shown recently, don't bother
  }

  googletag.cmd.push(function () {
    var adSlotRewarded = googletag
      .defineOutOfPageSlot(REWARD_AD_PATH, googletag.enums.OutOfPageFormat.REWARDED)
      .addService(googletag.pubads());

    if (!adSlotRewarded) { return; }

    adSlotRewarded.setForceSafeFrame(true);
    googletag.pubads().enableAsyncRendering();

    googletag.pubads().addEventListener("slotRenderEnded", function (event) {
      if (event.isEmpty) { rewardedAdEmpty = true; }
    });

    googletag.pubads().addEventListener("rewardedSlotReady", function (event) {
      rewardedAdReady = true;
      rewardedAdEvent = event;
    });

    googletag.display(adSlotRewarded);
  });
}

/* ================== REWARDED AD (show, on video-playing page only) ================== */
function triggerRewardedAd(onDone) {
  var done = false;
  function finish() {
    if (done) { return; }
    done = true;
    onDone();
  }

  var last = localStorage.getItem("hasShownRewardedAd");
  var now = Date.now();
  if (last && (now - parseInt(last, 10) <= 6e5)) {
    finish();
    return;
  }

  if (rewardedAdEmpty) {
    finish();
    return;
  }

  var modal = document.getElementById("rewardModal");
  var closeButton = document.querySelector("#rewardModal .btn");

  function showModal(event) {
    modal.classList.remove("hidden");
    modal.classList.add("block");
    try { history.pushState(null, null, location.href); } catch (e) {}
    event.makeRewardedVisible();
  }

  function hideModalAndFinish() {
    modal.classList.remove("block");
    modal.classList.add("hidden");
    localStorage.setItem("hasShownRewardedAd", Date.now().toString());
    finish();
  }

  googletag.pubads().addEventListener("impressionViewable", function () {
    setTimeout(function () {
      closeButton.style.display = "block";
    }, 30000);
  });

  googletag.pubads().addEventListener("rewardedSlotClosed", hideModalAndFinish);
  closeButton.onclick = hideModalAndFinish;

  window.addEventListener("popstate", function () {
    try { history.pushState(null, null, location.href); } catch (e) {}
  });

  if (rewardedAdReady && rewardedAdEvent) {
    showModal(rewardedAdEvent);
    return;
  }

  // still loading — short grace window, then continue anyway
  var safetyTimer = setTimeout(finish, 5000);
  var checkInterval = setInterval(function () {
    if (rewardedAdEmpty) {
      clearInterval(checkInterval);
      clearTimeout(safetyTimer);
      finish();
    } else if (rewardedAdReady && rewardedAdEvent) {
      clearInterval(checkInterval);
      clearTimeout(safetyTimer);
      showModal(rewardedAdEvent);
    }
  }, 150);
}

/* ================== GEO DETECTION (country-verification page only) ================== */
function detectRegion() {
  var countryData = {
    GB: { flag: "🇬🇧", name: "United Kingdom", short: "the UK" },
    CA: { flag: "🇨🇦", name: "Canada", short: "Canada" },
    US: { flag: "🇺🇸", name: "United States", short: "the US" }
  };

  fetch("https://ipapi.co/json/")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var code = data && data.country_code;
      var info = countryData[code] || countryData.US;
      applyRegion(info);
    })
    .catch(function () {
      applyRegion(countryData.US);
    });
}

function applyRegion(info) {
  var flagEl = document.getElementById("regionFlag");
  var nameEl = document.getElementById("regionName");
  var enterBtn = document.getElementById("regionEnterBtn");
  var exitBtn = document.getElementById("regionExitBtn");
  if (!flagEl) { return; }
  flagEl.textContent = info.flag;
  nameEl.textContent = info.name;
  enterBtn.textContent = "I am in " + info.short + " — Enter";
  exitBtn.textContent = "I am not in " + info.short + " — Exit";
}

function goToNextPage(url) {
  var loadingEl = document.getElementById('loadingState');
  var cardEl = document.querySelector('.card');
  if (loadingEl && cardEl) {
    cardEl.style.display = 'none';
    loadingEl.classList.add('active');
  }
  setTimeout(function () {
    window.location.href = url;
  }, 2000);
}

function runHumanCheck() {
  var visual = document.getElementById('verifyVisual');
  var bar = document.getElementById('verifyBar');
  if (!visual) { return; }
  visual.classList.add('show');
  setTimeout(function () {
    bar.style.width = '100%';
  }, 30);
}
