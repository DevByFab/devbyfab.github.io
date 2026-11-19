import { formatBigValue } from '../game/format';
import type { UpgradeOfferSnapshot } from '../game/types';

type TranslateFn = (key: string) => string;

export function formatUpgradeCosts(offer: UpgradeOfferSnapshot, t: TranslateFn): string[] {
  const costs: string[] = [];

  if ((offer.costBots) > 0) {
    costs.push(t('reboot.resources.bots') + ' ' + formatBigValue(offer.costBots));
  }
  if ((offer.costMoney) > 0) {
    costs.push('$ ' + formatBigValue(offer.costMoney));
  }
  if ((offer.costIntel) > 0) {
    costs.push(t('reboot.resources.warIntel') + ' ' + formatBigValue(offer.costIntel));
  }
  if ((offer.costHz) > 0) {
    costs.push(t('reboot.resources.hz') + ' ' + formatBigValue(offer.costHz));
  }
  if ((offer.costComputronium) > 0) {
    costs.push(t('reboot.resources.computronium') + ' ' + formatBigValue(offer.costComputronium));
  }

  return costs;
}

export function hasOwnedUpgrade(offers: UpgradeOfferSnapshot[], chainId: string): boolean {
  return offers.some((offer) => offer.chainId === chainId && offer.currentLevel > 0);
}
