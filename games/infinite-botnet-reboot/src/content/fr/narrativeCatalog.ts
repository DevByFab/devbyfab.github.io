import type { MessageRewardType, MessageTone } from '../../game/types';

export type NarrativeBucket = 'economy' | 'war' | 'matrix' | 'warning';

export interface FrNarrativeTemplate {
  id: string;
  bucket: NarrativeBucket;
  source: string;
  tone: MessageTone;
  rewardType: MessageRewardType;
  subject: string;
  body: string;
  rewardHint: string;
}

export const FR_NARRATIVE_CATALOG: Record<NarrativeBucket, FrNarrativeTemplate[]> = {
  economy: [
    {
      id: 'eco-broker-window',
      bucket: 'economy',
      source: 'Bourse Fantome',
      tone: 'positive',
      rewardType: 'money',
      subject: 'Fenetre de liquidite ouverte',
      body: 'Un broker clandestin ouvre une route de cash pendant quelques cycles. Action rapide recommande.',
      rewardHint: 'Injection de Dark Money',
    },
    {
      id: 'eco-scrap-lot',
      bucket: 'economy',
      source: 'Canal Ferraille IoT',
      tone: 'neutral',
      rewardType: 'bots',
      subject: 'Lot IoT compromis disponible',
      body: 'Un lot de firmwares faibles est en vente. Tu peux absorber du volume sans bruit excessif.',
      rewardHint: 'Renfort bots brut',
    },
    {
      id: 'eco-fund-mirror',
      bucket: 'economy',
      source: 'Desk Mirroir',
      tone: 'positive',
      rewardType: 'portfolio',
      subject: 'Arbitrage fantome detecte',
      body: 'Un spread artificiel sur des actifs synth est visible. Le desk peut en profiter avant fermeture.',
      rewardHint: 'Boost portfolio',
    },
  ],
  war: [
    {
      id: 'war-tracker-leak',
      bucket: 'war',
      source: 'Cellule Recon',
      tone: 'positive',
      rewardType: 'intel',
      subject: 'Telemetrie rivale interceptee',
      body: 'Un relais ennemi fuit des signatures de trajectoire. Exploitable pour les prochaines frappes.',
      rewardHint: 'War Intel',
    },
    {
      id: 'war-mercenary-route',
      bucket: 'war',
      source: 'Proxy Mercenaire',
      tone: 'neutral',
      rewardType: 'bots',
      subject: 'Route de mercenaires numeriques',
      body: 'Une escouade bot est disponible en renfort court terme. Prix variable selon la pression Heat.',
      rewardHint: 'Renfort tactique',
    },
    {
      id: 'war-counter-grid',
      bucket: 'war',
      source: 'Sentinelle Noire',
      tone: 'negative',
      rewardType: 'bots',
      subject: 'Contre-ciblage en cours',
      body: 'Le rival a mappe un segment de ton maillage. Ignorer le signal peut couter des relais.',
      rewardHint: 'Perte bot potentielle',
    },
  ],
  matrix: [
    {
      id: 'matrix-key-fragment',
      bucket: 'matrix',
      source: 'Archive Fragmentee',
      tone: 'positive',
      rewardType: 'intel',
      subject: 'Fragment de cle de bypass',
      body: 'Une signature partielle du watchdog a ete capturee. Peut rendre les injections plus stables.',
      rewardHint: 'Intel de contournement',
    },
    {
      id: 'matrix-pulse-noise',
      bucket: 'matrix',
      source: 'Bruit Neural',
      tone: 'negative',
      rewardType: 'money',
      subject: 'Pulse de corruption detecte',
      body: 'Un bruit de fond degrade les transactions de stabilisation. Les couts peuvent grimper brutalement.',
      rewardHint: 'Drain financier',
    },
  ],
  warning: [
    {
      id: 'warn-heat-spike',
      bucket: 'warning',
      source: 'Alerte Detection',
      tone: 'negative',
      rewardType: 'money',
      subject: 'Pic de detection mondial',
      body: 'Le pattern de trafic devient visible. Sans quarantaine rapide, les pertes de cash vont s accelerer.',
      rewardHint: 'Perte dark money',
    },
    {
      id: 'warn-coolant-backdoor',
      bucket: 'warning',
      source: 'Collectif Thermique',
      tone: 'positive',
      rewardType: 'heat-relief',
      subject: 'Backdoor de dissipation ouverte',
      body: 'Une fenetre courte permet de purger une partie de la Heat. Utilise-la avant fermeture.',
      rewardHint: 'Reduction Heat',
    },
  ],
};
