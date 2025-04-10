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
      diffFromBest: null,
      completed: false
    };
    
    const currSplit = currRunBossSplits[segmentName];
    
    const startCriteria = segment.start ?? null;
    const endCriteria = segment.end ?? /^\s*☠ Defeated (.+) in 0?([\dhms ]+?)\s*(\(NEW RECORD!\))?$/;
    
    if (startCriteria) {
      bossTriggers.push(
        register("chat", () => {
          currSplit.timer.restart();
          currSplit.completed = false;
        }).setCriteria(startCriteria)
      );
    }
    
    bossTriggers.push(
      register("chat", () => {
        if (!currSplit.timer.isRunning) return;
        
        currSplit.timer.stop();
        currSplit.completed = true;
        const timeInSeconds = currSplit.timer.getSeconds();
        const timeMs = Math.floor(timeInSeconds * 1000);
        
        const oldBest = SplitUtils.getBestSplit(BOSS, floor, segmentName, bossSplitData);
        currSplit.diffFromBest = oldBest === null ? 0 : timeMs - oldBest;
        
        const displayName = segmentName.removeFormatting ? segmentName.removeFormatting() : segmentName;
        if (SplitUtils.saveBestSplit(BOSS, floor, segmentName, timeInSeconds, bossSplitData)) {
          ChatLib.chat(`${prefix} §dNew segment PB for ${floor.startsWith("M") ? "§c" : "§a"}§l${floor} ${displayName}: ${SplitUtils.formatTime(timeInSeconds)}`);
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
    const timeStr = active 
      ? `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.formatTime(split.timer.getSeconds())}` 
      : SplitUtils.DEFAULT_TIMER_TEXT;
      
    let comparisonText = "";
    if (split.completed && split.diffFromBest !== null) {
      const prefix = split.diffFromBest < 0 ? "-" : "+";
      const color = split.diffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
      comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(split.diffFromBest / 1000), 2)})`;
    }
    
    segments.push({ name, timeStr, comparisonText });
  });
  
  if (currRunBossSplits["§aBoss"]) {
    const bossSplit = currRunBossSplits["§aBoss"];
    const active = bossSplit.timer && (bossSplit.timer.isRunning || bossSplit.timer.getTicks() > 0);
    
    const timeStr = active
      ? `${SplitUtils.ACTIVE_TIMER_COLOR}${SplitUtils.formatTime(bossSplit.timer.getSeconds())}`
      : SplitUtils.DEFAULT_TIMER_TEXT;
      
    let comparisonText = "";
    if (bossSplit.completed && bossSplit.diffFromBest !== null) {
      const prefix = bossSplit.diffFromBest < 0 ? "-" : "+";
      const color = bossSplit.diffFromBest < 0 ? SplitUtils.PB_IMPROVED_COLOR : SplitUtils.PB_WORSE_COLOR;
      comparisonText = ` ${color}(${prefix}${SplitUtils.formatTime(Math.abs(bossSplit.diffFromBest / 1000), 2)})`;
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