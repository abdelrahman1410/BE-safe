// BE SAFE - shared header, footer and language switching.
// Each page sets <body data-page="home|services|library|tools|request" data-root="./" or "../">.
(function () {
  var WHATSAPP = "966539852062";
  var EMAIL = "abdelrahmanelsayed946@gmail.com";
  var LINKEDIN = "https://www.linkedin.com/in/abdelrahman-zain-8b491613a";
  window.BESAFE_LINKEDIN = LINKEDIN;
  window.BESAFE_WHATSAPP = WHATSAPP;

  var body = document.body;
  var root = body.getAttribute("data-root") || "./";
  var page = body.getAttribute("data-page") || "";

  // Builds a WhatsApp link with an optional prefilled message.
  window.waLink = function (text) {
    return "https://wa.me/" + WHATSAPP + (text ? "?text=" + encodeURIComponent(text) : "");
  };

  function t(en, ar) {
    return '<span data-l="en">' + en + '</span><span data-l="ar">' + ar + "</span>";
  }

  var waIcon =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';
  window.BESAFE_WA_ICON = waIcon;

  var links = [
    ["home", "", "Home", "الرئيسية"],
    ["about", "about/", "About", "من أنا"],
    ["services", "services/", "Expertise", "الخبرات"],
    ["library", "library/", "Library", "المكتبة"],
    ["tools", "tools/", "Risk Tools", "أدوات المخاطر"],
    ["request", "request/", "Contact", "تواصل معنا"]
  ];

  var nav = links
    .map(function (l) {
      return (
        '<a href="' + root + l[1] + '"' + (l[0] === page ? ' class="active"' : "") + ">" + t(l[2], l[3]) + "</a>"
      );
    })
    .join("");

  var header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML =
    '<div class="container">' +
    '<a class="brand" href="' + root + '"><img src="' + root + 'app/icons/icon-192-v2.png" alt="">BE SAFE</a>' +
    '<nav class="nav" id="nav">' + nav + "</nav>" +
    '<button class="lang-btn" type="button" id="langBtn"></button>' +
    '<button class="menu-btn" type="button" id="menuBtn" aria-label="Menu">' +
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
    "</button></div>";
  body.insertBefore(header, body.firstChild);

  var footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML =
    '<div class="container"><div class="cols">' +
    "<div>" +
    '<a class="brand" href="' + root + '"><img src="' + root + 'app/icons/icon-192-v2.png" alt="">BE SAFE</a>' +
    "<p>" + t(
      "Practical HSE tools, templates and know-how by Abdul Rahman Zain, Senior HSE Professional.",
      "أدوات ونماذج ومعرفة عملية في السلامة المهنية من عبدالرحمن زين، أخصائي أول في الصحة والسلامة والبيئة."
    ) + "</p></div>" +
    "<div><h4>" + t("Pages", "الصفحات") + "</h4><ul>" +
    links.map(function (l) { return '<li><a href="' + root + l[1] + '">' + t(l[2], l[3]) + "</a></li>"; }).join("") +
    '<li><a href="' + root + 'app/">' + t("Mobile App", "تطبيق الموبايل") + "</a></li>" +
    "</ul></div>" +
    "<div><h4>" + t("Contact", "تواصل") + "</h4><ul>" +
    '<li><a href="' + window.waLink() + '" target="_blank" rel="noopener">WhatsApp: <span dir="ltr">+' + WHATSAPP + "</span></a></li>" +
    '<li><a href="mailto:' + EMAIL + '">' + EMAIL + "</a></li>" +
    '<li><a href="' + LINKEDIN + '" target="_blank" rel="noopener">LinkedIn</a></li>' +
    "<li>" + t("Buraydah, Qassim, Saudi Arabia", "بريدة، القصيم، المملكة العربية السعودية") + "</li>" +
    "</ul></div>" +
    "</div>" +
    '<div class="copy">© ' + new Date().getFullYear() + " BE SAFE · " + t("Abdul Rahman Zain", "عبدالرحمن زين") + "</div></div>";
  body.appendChild(footer);

  var wa = document.createElement("a");
  wa.className = "wa-float";
  wa.href = window.waLink();
  wa.target = "_blank";
  wa.rel = "noopener";
  wa.setAttribute("aria-label", "WhatsApp");
  wa.innerHTML = waIcon;
  body.appendChild(wa);

  // Fill every element marked data-wa with a WhatsApp link (data-wa holds the message).
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.href = window.waLink(el.getAttribute("data-wa"));
    el.target = "_blank";
    el.rel = "noopener";
  });

  // Language
  var langBtn = document.getElementById("langBtn");
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    langBtn.textContent = lang === "ar" ? "English" : "عربي";
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  langBtn.addEventListener("click", function () {
    setLang(document.documentElement.lang === "ar" ? "en" : "ar");
  });
  setLang(document.documentElement.lang === "ar" ? "ar" : "en");

  // Mobile menu
  document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("nav").classList.toggle("open");
  });
})();
