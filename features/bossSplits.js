import { LocalStore } from "../../tska/storage/LocalStore";
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import { prefix, registerWhen } from "../utils/utils";
import hudManager, { Hud } from "../utils/hud";
import SplitUtils from "../utils/splitUtils";
import splitInfo from "../data/floorSplits";
import TickTimer from "../utils/TickTimer";
import { data } from "../utils/data";
import config from "../config";

export const bossSplitData = new LocalStore("TickSplits/data", { boss: {} }, "bossSplitPBs.json");

const { BOSS } = SplitUtils.SPLIT_TYPES;

let currentFloor = null
let currRunBossSplits = {}
const bossTriggers = []

const placeholderText = `§6Boss Splits §7(§a§lF7§7)
§aMaxor           §7--.---
§bStorm           §7--.---
§eTerminals       §7--.---
§7Goldor          §7--.---
§cNecron          §7--.---`;

const bossSplitsHud = new Hud("bossSplitsGui", placeholderText, hudManager, data);

const cleanupBossSplits = () => {
  bossTriggers.forEach(trigger => trigger.unregister());
  bossTriggers.length = 0;
  
  Object.values(currRunBossSplits).forEach(split => {
    if (split.timer) {
      split.timer.stop();
      split.timer.reset();
    }
  });
  
  currRunBossSplits = {};
}

const registerBossSplits = (floor) => {
  if (!floor) return;
  
  let floorKey = floor;
  if (!(floorKey in splitInfo)) {
    floorKey = "F" + floorKey.slice(1);
    if (!(floorKey in splitInfo)) {
      ChatLib.chat(`${prefix} §cCould not find splits for floor ${floor}`);
      return;
    }
  }
  
  const splitData = splitInfo[floorKey];
  cleanupBossSplits();
  
  splitData.forEach((segment, i) => {
    const segmentName = segment.name;
    
    currRunBossSplits[segmentName] = {
      timer: new TickTimer(),
      tickDiffFromBest: null,
      realtimeDiffFromBest: null,
      completed: false,
      finalTimes: null
    };
    
    const currSplit = currRunBossSplits[segmentName];
    
    const startCriteria = segment.start ?? null;
    const endCriteria = segment.end ?? /^\s*☠ Defeated (.+) in 0?([\dhms ]+?)\s*(\(NEW RECORD!\))?$/;
    
    if (startCriteria) {
      bossTriggers.push(
        register("chat", () => {
          currSplit.timer.restart();
          currSplit.completed = false;
          currSplit.finalTimes = null;
        }).setCriteria(startCriteria)
      );
    }
    
    bossTriggers.push(
      register("chat", () => {
        if (!currSplit.timer.isRunning) return;
        
        currSplit.timer.stop();
        currSplit.completed = true;
        const tickTime = currSplit.timer.getSeconds();
        const realtimeTime = currSplit.timer.getRealtimeSeconds();
        currSplit.finalTimes = { tick: tickTime, realtime: realtimeTime };
        
        const tickTimeMs = Math.floor(tickTime * 1000);
        const realtimeMs = Math.floor(realtimeTime * 1000);
        
        const oldBests = SplitUtils.getBestSplit(BOSS, floor, segmentName, bossSplitData);
        currSplit.tickDiffFromBest = oldBests.tick === null ? 0 : tickTimeMs - oldBests.tick;
        currSplit.realtimeDiffFromBest = oldBests.realtime === null ? 0 : realtimeMs - oldBests.realtime;
        
        const displayName = segmentName.removeFormatting ? segmentName.removeFormatting() : segmentName;
        const improvement = SplitUtils.saveBestSplit(BOSS, floor, segmentName, tickTime, realtimeTime, bossSplitData);
        
        if (improvement.improvedTick || improvement.improvedRealtime) {
          const pbType = improvement.improvedTick && improvement.improvedRealtime ? "both" : improvement.improvedTick ? "tick" : "realtime";
          const timeDisplay = (config.displayStyle === 1 || config.displayStyle === 2) ? SplitUtils.formatTime(realtimeToSave) : SplitUtils.formatTime(tickTimeToSave);
          
          ChatLib.chat(`${prefix} §dNew ${pbType} PB for ${floor.startsWith("M") ? "§c" : "§a"}§l${floor} ${displayName}: ${timeDisplay}`);
        }

        if (i < splitData.length - 1 && !splitData[i + 1].start) {
          const nextSeg = splitData[i + 1].name;
          if (currRunBossSplits[nextSeg]) currRunBossSplits[nextSeg].timer.restart();
        }
      }).setCriteria(endCriteria)
    );
  });
}

const renderBossSplitsHud = () => {
  if (hudManager.isEditing && Object.keys(currRunBossSplits).length === 0) {
    bossSplitsHud.draw(placeholderText);
    return;
  }
  
  if (Object.keys(currRunBossSplits).length === 0) return;
  
  const splitTitle = SplitUtils.createSplitTitle("Boss", currentFloor);
  
  let floorKey = currentFloor;
  if (!(floorKey in splitInfo)) {
    floorKey = "F" + floorKey.slice(1);
    if (!(floorKey in splitInfo)) return;
  }
  
  const splitDefinitions = splitInfo[floorKey];
  const segments = [];
  
  splitDefinitions.forEach(segmentDef => {
    const name = segmentDef.name;
    if (name === "§aBoss") return;
    
    const split = currRunBossSplits[name];
    if (!split) return;
    
    const active = split.timer && (split.timer.isRunning || split.timer.getTicks() > 0);
    
    let timeStr;
    if (active) {
      if (split.completed && split.finalTimes) timeStr = `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.getDisplayTime(null, split.finalTimes.realtime, split.finalTimes.tick)}`;
      else timeStr = `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.getDisplayTime(split.timer)}`;
    } else timeStr = SplitUtils.DEFAULT_TIMER_TEXT;
      
    let comparisonText = "";
    if (split.completed && config.displayStyle !== 2) {
      if (config.displayStyle === 0 && split.tickDiffFromBest !== null) {
        const prefix = split.tickDiffFromBest < 0 ? "-" : "+";
        const color = split.tickDiffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
        comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(split.tickDiffFromBest / 1000), 2)})`;
      } else if (config.displayStyle === 1 && split.realtimeDiffFromBest !== null) {
        const prefix = split.realtimeDiffFromBest < 0 ? "-" : "+";
        const color = split.realtimeDiffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
        comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(split.realtimeDiffFromBest / 1000), 2)})`;
      }
    }
    
    segments.push({ name, timeStr, comparisonText });
  });
  
  if (currRunBossSplits["§aBoss"]) {
    const bossSplit = currRunBossSplits["§aBoss"];
    const active = bossSplit.timer && (bossSplit.timer.isRunning || bossSplit.timer.getTicks() > 0);
    
    let timeStr;
    if (active) {
      if (bossSplit.completed && bossSplit.finalTimes) timeStr = `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.getDisplayTime(null, bossSplit.finalTimes.realtime, bossSplit.finalTimes.tick)}`;
      else timeStr = `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.getDisplayTime(bossSplit.timer)}`;
    } else timeStr = SplitUtils.DEFAULT_TIMER_TEXT;
      
    let comparisonText = "";
    if (bossSplit.completed && config.displayStyle !== 2) {
      if (config.displayStyle === 0 && bossSplit.tickDiffFromBest !== null) {
        const prefix = bossSplit.tickDiffFromBest < 0 ? "-" : "+";
        const color = bossSplit.tickDiffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
        comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(bossSplit.tickDiffFromBest / 1000), 2)})`;
      } else if (config.displayStyle === 1 && bossSplit.realtimeDiffFromBest !== null) {
        const prefix = bossSplit.realtimeDiffFromBest < 0 ? "-" : "+";
        const color = bossSplit.realtimeDiffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
        comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(bossSplit.realtimeDiffFromBest / 1000), 2)})`;
      }
    }
    
    segments.push({ name: "§aBoss", timeStr, comparisonText });
  }
  
  const hudText = SplitUtils.renderSplitHud(splitTitle, segments);
  bossSplitsHud.draw(hudText);
}

register("worldUnload", () => {
  cleanupBossSplits();
  currentFloor = null;
});

register("gameUnload", () => {
  cleanupBossSplits();
  currentFloor = null;
});

register("tick", () => {
  const floor = Dungeon?.floor;
  
  if (floor && (currentFloor !== floor || Object.keys(currRunBossSplits).length === 0)) {
    currentFloor = floor;
    registerBossSplits(floor);
  }
});

registerWhen(register("renderOverlay", () => {
  if (!Dungeon.bossEntry && !hudManager.isEditing) return;
  renderBossSplitsHud();
}), () => config.bossSplits);