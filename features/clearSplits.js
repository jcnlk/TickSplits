import { entryMessages } from "../../BloomCore/utils/Utils";
import { LocalStore } from "../../tska/storage/LocalStore";
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import { prefix, registerWhen } from "../utils/utils";
import hudManager, { Hud } from "../utils/hud";
import SplitUtils from "../utils/splitUtils";
import { data } from "../utils/data";
import config from "../config";

export const clearSplitData = new LocalStore("TickSplits/data", { clear: {} }, "clearSplitPBs.json");

const { CLEAR } = SplitUtils.SPLIT_TYPES;

const SEGMENTS = {
  BLOOD_OPEN: "BloodOpen",
  BLOOD_DONE: "BloodDone",
  PORTAL: "Portal",
  BOSS_ENTRY: "BossEntry"
}

const SEGMENT_DISPLAY_NAMES = {
  [SEGMENTS.BLOOD_OPEN]: "Blood Open",
  [SEGMENTS.BLOOD_DONE]: "Blood Done",
  [SEGMENTS.PORTAL]: "Portal",
  [SEGMENTS.BOSS_ENTRY]: "Boss Entry"
}

const SEGMENT_COLORS = {
  [SEGMENTS.BLOOD_OPEN]: "§e",
  [SEGMENTS.BLOOD_DONE]: "§c",
  [SEGMENTS.PORTAL]: "§b",
  [SEGMENTS.BOSS_ENTRY]: "§d"
}

const clearTimers = SplitUtils.createTimers(Object.values(SEGMENTS));

const clearState = {
  bloodOpen: false,
  bloodStarted: false,
  bloodFinished: false,
  portalEntered: false,
  bossEntered: false,
  totalTime: 0,
  newPBs: {}
}

const clearTimes = {}

const placeholderText = `§6Clear Splits §7(§a§lF7§7)
§eBlood Open      §7--.---
§cBlood Done      §7--.---
§bPortal          §7--.---
§dBoss Entry      §7--.---`;

const clearSplitsHud = new Hud("clearSplitsHud", placeholderText, hudManager, data);

const resetClearState = () => {
  Object.keys(clearState).forEach(key => {
    if (key === "totalTime") clearState[key] = 0;
    if (key === "newPBs") clearState[key] = {};
    else clearState[key] = false;
  });
  
  Object.keys(clearTimes).forEach(key => delete clearTimes[key]);
  
  SplitUtils.resetTimers(clearTimers);
}

const handleClearSegmentComplete = (segmentName, timer) => {
  timer.stop();
  const completionTime = timer.getSeconds();
  const floor = Dungeon?.floor || 'Unknown';

  const displayName = SEGMENT_DISPLAY_NAMES[segmentName] || segmentName;
  clearTimes[segmentName] = completionTime;
  
  let timeToSave = completionTime;
  if (segmentName === SEGMENTS.BOSS_ENTRY) {
    const totalTime = (clearTimes[SEGMENTS.BLOOD_OPEN] || 0) + (clearTimes[SEGMENTS.BLOOD_DONE] || 0) + (clearTimes[SEGMENTS.PORTAL] || 0);
    clearState.totalTime = totalTime;
    timeToSave = totalTime;
  }
  
  const oldBest = SplitUtils.getBestSplit(CLEAR, floor, segmentName, clearSplitData);
  const isNewPB = SplitUtils.saveBestSplit(CLEAR, floor, segmentName, timeToSave, clearSplitData);
  
  if (isNewPB) {
    clearState.newPBs[segmentName] = {
      isNewPB: true,
      oldBest: oldBest
    };
    ChatLib.chat(`${prefix} §dNew segment PB for ${floor.startsWith("M") ? "§c" : "§a"}§l${floor} ${displayName}: ${SplitUtils.formatTime(timeToSave)}`);
  }
  
  return completionTime;
}

const registerClearTimers = () => {
  resetClearState();
  
  register("chat", () => {
    if (!clearState.bloodOpen) {
      clearState.bloodOpen = true;
      clearTimers[SEGMENTS.BLOOD_OPEN].restart();
    }
  }).setCriteria("[NPC] Mort: Here, I found this map when I first entered the dungeon.");

  const bloodStartMsg = [
    "[BOSS] The Watcher: Congratulations, you made it through the Entrance.", 
    "[BOSS] The Watcher: Ah, you've finally arrived.", 
    "[BOSS] The Watcher: Ah, we meet again...", 
    "[BOSS] The Watcher: So you made it this far... interesting.", 
    "[BOSS] The Watcher: You've managed to scratch and claw your way here, eh?", 
    "[BOSS] The Watcher: I'm starting to get tired of seeing you around here...", 
    "[BOSS] The Watcher: Oh.. hello?", 
    "[BOSS] The Watcher: Things feel a little more roomy now, eh?"
  ];
  
  bloodStartMsg.forEach((msg) => {
    register("chat", () => {
      if (clearState.bloodOpen && !clearState.bloodStarted) {
        clearState.bloodStarted = true;
        handleClearSegmentComplete(SEGMENTS.BLOOD_OPEN, clearTimers[SEGMENTS.BLOOD_OPEN]);
        clearTimers[SEGMENTS.BLOOD_DONE].restart();
      }
    }).setCriteria(msg);
  });

  register("chat", () => {
    if (clearState.bloodStarted && !clearState.bloodFinished) {
      clearState.bloodFinished = true;
      handleClearSegmentComplete(SEGMENTS.BLOOD_DONE, clearTimers[SEGMENTS.BLOOD_DONE]);
      clearTimers[SEGMENTS.PORTAL].restart();
    }
  }).setCriteria("[BOSS] The Watcher: You have proven yourself. You may pass.");

  entryMessages.forEach((msg) => {
    register("chat", () => {
      if (clearState.bloodFinished && !clearState.portalEntered) {
        clearState.portalEntered = true;
        handleClearSegmentComplete(SEGMENTS.PORTAL, clearTimers[SEGMENTS.PORTAL]);
        clearTimers[SEGMENTS.BOSS_ENTRY].restart();
      }
    }).setCriteria(msg);
  });
  
  register("chat", (event) => {
    if (clearState.portalEntered && !clearState.bossEntered) {
      const message = ChatLib.getChatMessage(event);
      if (message.startsWith("[BOSS]") && !message.includes("The Watcher:")) {
        clearState.bossEntered = true;
        handleClearSegmentComplete(SEGMENTS.BOSS_ENTRY, clearTimers[SEGMENTS.BOSS_ENTRY]);
      }
    }
  });
}

const renderClearSplitsHud = () => {
  if (hudManager.isEditing && (!Dungeon?.floor || !clearState.bloodOpen)) {
    clearSplitsHud.draw(placeholderText);
    return;
  }
  
  if (!Dungeon?.floor && !hudManager.isEditing) return;
  
  const floor = Dungeon?.floor || 'F7';
  const splitTitle = SplitUtils.createSplitTitle("Clear", floor);
  
  const segmentConfigs = [
    {
      name: `${SEGMENT_COLORS[SEGMENTS.BLOOD_OPEN]}Blood Open`,
      internalName: SEGMENTS.BLOOD_OPEN,
      active: clearState.bloodOpen,
      completed: clearState.bloodStarted
    },
    {
      name: `${SEGMENT_COLORS[SEGMENTS.BLOOD_DONE]}Blood Done`,
      internalName: SEGMENTS.BLOOD_DONE,
      active: clearState.bloodStarted,
      completed: clearState.bloodFinished
    },
    {
      name: `${SEGMENT_COLORS[SEGMENTS.PORTAL]}Portal`,
      internalName: SEGMENTS.PORTAL,
      active: clearState.bloodFinished,
      completed: clearState.portalEntered
    },
    {
      name: `${SEGMENT_COLORS[SEGMENTS.BOSS_ENTRY]}Boss Entry`,
      internalName: SEGMENTS.BOSS_ENTRY,
      active: clearState.portalEntered,
      completed: clearState.bossEntered,
      isTotal: true
    }
  ];
  
  const segments = segmentConfigs.map(config => {
    const { name, internalName, active, completed, isTotal } = config;
    
    if (!active) return { name, timeStr: SplitUtils.DEFAULT_TIMER_TEXT };
    
    const bloodOpenTime = clearState.bloodStarted ? (clearTimes[SEGMENTS.BLOOD_OPEN] || 0) : clearTimers[SEGMENTS.BLOOD_OPEN].getSeconds();
    const bloodDoneTime = clearState.bloodFinished ? (clearTimes[SEGMENTS.BLOOD_DONE] || 0) : clearTimers[SEGMENTS.BLOOD_DONE].getSeconds();
    const portalTime = clearState.portalEntered ? (clearTimes[SEGMENTS.PORTAL] || 0) : clearTimers[SEGMENTS.PORTAL].getSeconds();
    
    const totalTime = bloodOpenTime + bloodDoneTime + portalTime;
    
    let currentTime;
    if (isTotal) currentTime = totalTime;
    else currentTime = completed ? clearTimes[internalName] : clearTimers[internalName].getSeconds();
    
    const timeStr = `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.formatTime(currentTime)}`;
    
    let comparisonText = "";
    if (completed) {
      const pbInfo = clearState.newPBs[internalName];
      
      if (pbInfo && pbInfo.isNewPB && pbInfo.oldBest !== null) {
        const timeMs = isTotal 
          ? Math.floor(totalTime * 1000) 
          : Math.floor(clearTimes[internalName] * 1000);
          
        comparisonText = ` ${SplitUtils.PB_IMPROVED_COLOR}(-${SplitUtils.formatTime(Math.abs((timeMs - pbInfo.oldBest) / 1000), 2)})`;
      } else {
        const oldBest = SplitUtils.getBestSplit(CLEAR, floor, internalName, clearSplitData);
        if (oldBest !== null) {
          const timeMs = isTotal 
            ? Math.floor(totalTime * 1000) 
            : Math.floor(clearTimes[internalName] * 1000);
          
          comparisonText = SplitUtils.getComparisonText(timeMs, oldBest);
        }
      }
    }
    
    return { name, timeStr, comparisonText };
  });
  
  const hudText = SplitUtils.renderSplitHud(splitTitle, segments);
  clearSplitsHud.draw(hudText);
}

registerClearTimers();

register("worldUnload", resetClearState);
register("gameUnload", resetClearState);

registerWhen(register("renderOverlay", renderClearSplitsHud), () => config.clearSplits);