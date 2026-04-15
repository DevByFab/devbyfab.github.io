import { formatBigValue } from '../game/format';
import type { UpgradeOfferSnapshot } from '../game/types';

type TranslateFn = (key: string) => string;

export function formatUpgradeCosts(offer: UpgradeOfferSnapshot, t: TranslateFn): string[] {
  const costs: string[] = [];

  if (BigInt(offer.costBots) > 0n) {
    costs.push(t('reboot.resources.bots') + ' ' + formatBigValue(offer.costBots));
  }
  if (BigInt(offer.costMoney) > 0n) {
    costs.push('$ ' + formatBigValue(offer.costMoney));
  }
  if (BigInt(offer.costIntel) > 0n) {
    costs.push(t('reboot.resources.warIntel') + ' ' + formatBigValue(offer.costIntel));
  }
  if (BigInt(offer.costHz) > 0n) {
    costs.push(t('reboot.resources.hz') + ' ' + formatBigValue(offer.costHz));
  }
  if (BigInt(offer.costComputronium) > 0n) {
    costs.push(t('reboot.resources.computronium') + ' ' + formatBigValue(offer.costComputronium));
  }

  return costs;
}

export function hasOwnedUpgrade(offers: UpgradeOfferSnapshot[], chainId: string): boolean {
  return offers.some((offer) => offer.chainId === chainId && offer.currentLevel > 0);
}
