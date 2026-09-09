import { describe, expect, it } from 'vitest';
import { isUnwantedOnboarding } from '../companion-extension/tab-policy.js';
describe('extension onboarding suppression', () => {
  it('matches only the two requested onboarding pages', () => {
    for (const id of ['bphfhlfhnohppnleaehnlfigkkccpglk', 'jplgfhpmjnbigmhklmmbgecoobifkmpa']) {
      expect(isUnwantedOnboarding(`chrome-extension://${id}/onboarding.html?first=true#start`)).toBe(true);
      expect(isUnwantedOnboarding(`chrome-extension://${id}/popup.html`)).toBe(false);
    }
    expect(isUnwantedOnboarding('https://example.com/onboarding.html')).toBe(false);
    expect(isUnwantedOnboarding('chrome-extension://another-extension/onboarding.html')).toBe(false);
  });
});
