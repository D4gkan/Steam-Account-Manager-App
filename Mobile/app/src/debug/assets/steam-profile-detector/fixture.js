(function () {
  "use strict";

  if (location.pathname !== "/id/sam-geckoview-synthetic-fixture" ||
      location.search !== "?sam-synthetic-bridge=1") return;

  const profile = document.createElement("a");
  profile.className = "user_avatar";
  profile.href = "https://steamcommunity.com/id/sam-geckoview-synthetic-bridge";
  const avatar = document.createElement("img");
  avatar.src = "https://avatars.steamstatic.com/synthetic_bridge_avatar.jpg";
  profile.appendChild(avatar);
  document.body.appendChild(profile);
})();
