(function () {
  "use strict";

  try {
    const avatar = document.querySelector(
      ".playerAvatar img, .persona_name_text_content img, a.user_avatar img"
    );
    const profile = document.querySelector("a.user_avatar, a.persona_name");
    if (!avatar && !profile) return;

    const port = browser.runtime.connectNative("steamProfileDetector");
    port.postMessage({
      type: "profile",
      avatarUrl: avatar ? avatar.src : null,
      profileUrl: profile ? profile.href : null
    });
  } catch (_) {
    // Detection is best-effort and must never interfere with the Steam page.
  }
})();
