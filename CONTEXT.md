# Steam Account Manager domain context

Steam Account Manager keeps multiple Steam-related website sessions on one Android device without sharing their authenticated browser state. Account and session metadata stay local; browser storage belongs to the browser engine.

## Language

**Account**: A local user-defined identity. An account is not itself a browser-storage boundary.

**Website**: A configured destination and its navigation allowlist, including permitted authentication domains.

**Browser session**: Exactly one `(account, website)` pair. Cookies, site storage, authenticated identity, extension storage, permissions and tracking state must remain isolated from every other pair, including another website under the same account.

**Session identity**: The stable identity derived from the account and website identifiers. Reopening it restores the same browser profile.

**Browser profile**: Engine-owned persistent browser and extension state for one browser session. It is not copied into the account/session metadata database.

**Browser shell**: App-owned navigation, loading/error recovery, permission prompts, extension controls and external handoff surrounding a browser session.

**Navigation policy**: The allowed primary and authentication destinations for a website. Other web destinations require explicit external handoff; malformed or non-web destinations are rejected.

**Supported extension**: A pinned, official, unmodified Firefox package selected for a configured website: CSFloat for Steam/CSFloat, CS.MONEY for CS.MONEY, and Skins.com Marketplace for Skins.com. Installation and additional access require explicit consent within that browser session. Trade Token Sync is deferred until a publisher-issued Firefox package exists (issue #17).

**Extension revocation**: Disabling or uninstalling an extension only within its browser session. Restoration is an explicit enable or reinstall; reinstall repeats installation consent. Optional host permissions may additionally be granted or revoked through explicit app controls or a package request.

**Steam profile detector**: The app-owned, separately consented feature that reads visible public Steam avatar/profile links. It does not receive credentials or browser storage, and is enabled only for the Steam website.

**Compatibility gate**: An evidence-backed GO/NO-GO decision for a pinned browser/package combination on emulator and a supported physical device. A package listing, build success or popup alone is not end-to-end compatibility evidence.

## Decision and verification sources

- [Architecture and isolation contract](docs/adr/0001-adopt-geckoview-for-csfloat.md)
- [Compatibility contract](docs/verification/geckoview-csfloat-prototype.md)
- [Final manual verification](docs/manual-testing/geckoview-final-release.md)
- [Campaign #3](https://github.com/D4gkan/Steam-Account-Manager-App/issues/3)
