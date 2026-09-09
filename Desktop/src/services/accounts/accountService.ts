import { AccountRepository } from "../../persistence/repositories/accountRepository";
import {
  checkForIdentityMismatch,
  detectOwnIdentity,
  SteamPageSignals,
} from "../metadata/steamIdentityAdapter";
import { Account, AccountId } from "../../domain/types";

export type OnboardingOutcome =
  | { kind: "confirmed"; account: Account }
  | { kind: "not_authenticated" }
  | { kind: "detection_failed" }
  | { kind: "duplicate"; existingAccount: Account }
  | { kind: "mismatch"; expectedSteamId64: string; observedSteamId64: string };

/**
 * Orchestrates identity confirmation for one account against a live signal
 * from the companion extension's content script. This is the only place
 * that writes identity results to the database -- the adapter itself
 * (steamIdentityAdapter.ts) stays pure and untestable-against-a-browser-free.
 */
export class AccountOnboardingService {
  constructor(private accounts: AccountRepository) {}

  /**
   * Called during initial onboarding, before an account has any confirmed
   * SteamID64. Never binds an unverified ID, and explicitly refuses to
   * merge into an existing account with the same SteamID64 -- the caller
   * must guide the user to the existing account instead.
   */
  handleOnboardingSignal(accountId: AccountId, signals: SteamPageSignals, avatarCachePath: string | null): OnboardingOutcome {
    const detection = detectOwnIdentity(signals);

    if (detection.kind === "not_authenticated") {
      return { kind: "not_authenticated" };
    }
    if (detection.kind === "signals_unavailable") {
      this.accounts.markDetectionFailed(accountId);
      return { kind: "detection_failed" };
    }

    const existing = this.accounts.findBySteamId64(detection.steamId64);
    if (existing && existing.id !== accountId) {
      return { kind: "duplicate", existingAccount: existing };
    }

    this.accounts.confirmIdentity(accountId, detection.steamId64, detection.personaName, avatarCachePath);
    const account = this.accounts.findById(accountId);
    if (!account) throw new Error("Account disappeared during onboarding confirmation");
    return { kind: "confirmed", account };
  }

  /**
   * Called periodically (or on-demand) for an already-confirmed account to
   * detect a same-profile identity swap (the user logged into a different
   * Steam account inside the same persistent browser profile). Never
   * silently rebinds -- the caller must surface `mismatch` for explicit
   * user reconciliation.
   */
  checkOngoingIdentity(accountId: AccountId, signals: SteamPageSignals): OnboardingOutcome | { kind: "match" } | { kind: "inconclusive" } {
    const account = this.accounts.findById(accountId);
    if (!account || !account.steamId64) {
      throw new Error("checkOngoingIdentity requires an already-confirmed account");
    }

    const detection = detectOwnIdentity(signals);
    const comparison = checkForIdentityMismatch(account.steamId64, detection);

    if (comparison === "match") {
      if (detection.kind === "confirmed") {
        this.accounts.refreshMetadata(accountId, detection.personaName, account.avatarCachePath);
      }
      return { kind: "match" };
    }
    if (comparison === "inconclusive") {
      return { kind: "inconclusive" };
    }

    // mismatch: flag it, do not touch the stored identity
    this.accounts.markMismatched(accountId);
    return {
      kind: "mismatch",
      expectedSteamId64: account.steamId64,
      observedSteamId64: detection.kind === "confirmed" ? detection.steamId64 : "unknown",
    };
  }
}
