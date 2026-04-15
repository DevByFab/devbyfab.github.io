import type { EngineActionCommand } from '../../game/protocol';
import {
  commandCashoutPortfolio,
  commandExploit,
  commandInvestTranche,
  commandScan,
  commandToggleInvestMode,
  commandToggleMonetize,
} from '../domain/economy';
import { commandMatrixArm, commandMatrixInject, commandMatrixStabilize } from '../domain/matrix';
import { commandProcessMessage, commandQuarantineMessage } from '../domain/narrative';
import { commandWarAttack, commandWarFortify, commandWarScrub } from '../domain/war';
import { commandPurchaseUpgrade } from '../domain/upgrades';
import type { EngineState } from '../state';
import type { EmitLog } from './types';

export function dispatchCommand(
  state: EngineState,
  command: EngineActionCommand,
  emitLog: EmitLog,
): void {
  switch (command.type) {
    case 'SCAN': {
      const scanned = commandScan(state);
      if (scanned) {
        emitLog('Scan manuel: cible ajoutee a la file.', 'info');
      }
      break;
    }
    case 'EXPLOIT': {
      const result = commandExploit(state);
      if (result === 'blocked') {
        emitLog('Exploit bloque: aucune cible en file.', 'warn');
      } else if (result === 'cooldown') {
        emitLog('Exploit bloque: cooldown actif.', 'warn');
      } else if (result === 'success') {
        emitLog('Exploit reussi: bot connecte.', 'info');
      } else {
        emitLog('Exploit rate: cible durcie.', 'warn');
      }
      break;
    }
    case 'TOGGLE_MONETIZE': {
      const toggled = commandToggleMonetize(state);
      if (!toggled) {
        emitLog('Monetisation indisponible: volume bot trop faible.', 'warn');
      } else if (state.systems.monetizeActive) {
        emitLog('Monetisation activee.', 'info');
      } else {
        emitLog('Monetisation mise en pause.', 'info');
      }
      break;
    }
    case 'INVEST_TRANCHE': {
      const invested = commandInvestTranche(state);
      if (!invested) {
        emitLog('Tranche refusee: dark money insuffisant.', 'warn');
      } else {
        emitLog('Tranche investie sur le desk.', 'info');
      }
      break;
    }
    case 'CASHOUT_PORTFOLIO': {
      const cashedOut = commandCashoutPortfolio(state);
      if (!cashedOut) {
        emitLog('Aucun portefeuille a sortir.', 'warn');
      } else {
        emitLog('Portefeuille converti vers dark money (frais appliques).', 'info');
      }
      break;
    }
    case 'TOGGLE_INVEST_MODE': {
      commandToggleInvestMode(state);
      emitLog('Mode investissement -> ' + state.systems.investMode + '.', 'info');
      break;
    }
    case 'WAR_ATTACK': {
      const attackResult = commandWarAttack(state);
      if (attackResult === 'blocked') {
        emitLog('Frappe impossible: cooldown actif ou bots insuffisants.', 'warn');
      } else if (attackResult === 'win') {
        emitLog('Frappe victorieuse: intel capture.', 'info');
      } else {
        emitLog('Frappe perdue: la Heat explose.', 'warn');
      }
      break;
    }
    case 'WAR_SCRUB': {
      const scrubbed = commandWarScrub(state);
      if (!scrubbed) {
        emitLog('Scrub refuse: dark money insuffisant.', 'warn');
      } else {
        emitLog('Traces scrubbees, pression detection reduite.', 'info');
      }
      break;
    }
    case 'WAR_FORTIFY': {
      const fortified = commandWarFortify(state);
      if (!fortified) {
        emitLog('Defense pulse indisponible (cout/cooldown).', 'warn');
      } else {
        emitLog('Defense pulse deployee.', 'info');
      }
      break;
    }
    case 'MATRIX_ARM': {
      const armed = commandMatrixArm(state);
      if (!armed) {
        emitLog('Bypass non arme: verifier unlock et ressources.', 'warn');
      } else {
        emitLog('Bypass matrix arme.', 'info');
      }
      break;
    }
    case 'MATRIX_INJECT': {
      const result = commandMatrixInject(state, command.payload?.commandText);
      if (result === 'blocked') {
        emitLog('Injection bloquee: bypass ferme ou ressources insuffisantes.', 'warn');
      } else if (result === 'success') {
        emitLog('Injection acceptee par la matrice.', 'info');
      } else {
        emitLog('Injection rejetee: backlash actif.', 'warn');
      }
      break;
    }
    case 'MATRIX_STABILIZE': {
      const stabilized = commandMatrixStabilize(state);
      if (!stabilized) {
        emitLog('Stabilisation impossible: budget insuffisant.', 'warn');
      } else {
        emitLog('Matrice stabilisee temporairement.', 'info');
      }
      break;
    }
    case 'MESSAGE_PROCESS': {
      const processResult = commandProcessMessage(state);
      if (processResult === 'none') {
        emitLog('Aucun message a traiter.', 'warn');
      } else if (processResult === 'negative') {
        emitLog('Message traite: impact negatif applique.', 'warn');
      } else {
        emitLog('Message traite: avantage tactique recu.', 'info');
      }
      break;
    }
    case 'MESSAGE_QUARANTINE': {
      const quarantined = commandQuarantineMessage(state);
      if (!quarantined) {
        emitLog('Quarantaine refusee: cout non couvert.', 'warn');
      } else {
        emitLog('Message isole en quarantaine.', 'info');
      }
      break;
    }
    case 'PURCHASE_UPGRADE': {
      const result = commandPurchaseUpgrade(state, command.payload?.chainId);
      if (result === 'missing') {
        emitLog('Upgrade introuvable.', 'warn');
      } else if (result === 'maxed') {
        emitLog('Upgrade deja au niveau maximal.', 'warn');
      } else if (result === 'locked') {
        emitLog('Upgrade verrouillee: prerequis non atteints.', 'warn');
      } else if (result === 'insufficient') {
        emitLog('Upgrade refusee: ressources insuffisantes.', 'warn');
      } else {
        emitLog('Upgrade achetee: ' + (command.payload?.chainId ?? 'unknown') + '.', 'info');
      }
      break;
    }
    default:
      break;
  }
}
