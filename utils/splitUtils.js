import TickTimer from "./TickTimer";

export default class SplitUtils {
  static SPLIT_TYPES = {
    BOSS: "boss",
    CLEAR: "clear"
  }

  static DEFAULT_TIMER_TEXT = "§7--.---"
  static ACTIVE_TIMER_COLOR = "§e"
  static PB_IMPROVED_COLOR = "§a"
  static PB_WORSE_COLOR = "§c"

  static formatTime(time, msDigits = 3) {
    if (time instanceof TickTimer) time = time.getSeconds();
    
    if (time < 60) {
      const sec = Math.floor(time);
      const ms = Math.floor((time - sec) * 1000);
      const msStr = ms.toString().padStart(3, '0');
      
      return `${sec}.${msStr.slice(0, msDigits)}`;
    }
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 1000);
    const msStr = ms.toString().padStart(3, '0');
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${msStr.slice(0, msDigits)}`;
  }

  static padToWidth(text, targetWidth) {
    let paddedText = text;
    while (Renderer.getStringWidth(paddedText) < targetWidth) paddedText += " ";
    return paddedText;
  }

  static rightAlignToWidth(text, targetWidth) {
    let alignedText = text;
    while (Renderer.getStringWidth(alignedText) < targetWidth) alignedText = " " + alignedText;
    return alignedText;
  }

  static getComparisonText(timeMs, bestTime, msDigits = 2) {
    if (bestTime === null) return "";
    
    const diffFromBest = timeMs - bestTime;
    const prefix = diffFromBest < 0 ? "-" : "+";
    const color = diffFromBest < 0 ? this.PB_IMPROVED_COLOR : this.PB_WORSE_COLOR;
    
    return ` ${color}(${prefix}${this.formatTime(Math.abs(diffFromBest / 1000), msDigits)})`;
  }

  static saveBestSplit(splitType, floor, segmentName, timeInSeconds, splitData) {
    const unformatted = typeof segmentName.removeFormatting === 'function' 
      ? segmentName.removeFormatting() 
      : segmentName;
    
    const timeMs = Math.floor(timeInSeconds * 1000);
    
    if (!splitData[splitType]) splitData[splitType] = {};
    if (!splitData[splitType][floor]) splitData[splitType][floor] = {};
    
    const oldBest = splitData[splitType][floor][unformatted];
    
    if (oldBest === undefined || oldBest === null || timeMs < oldBest) {
      splitData[splitType][floor][unformatted] = timeMs;
      splitData.save();
      return true;
    }
    
    return false;
  }

  static getBestSplit(splitType, floor, segmentName, splitData) {
    const unformatted = typeof segmentName.removeFormatting === 'function' 
      ? segmentName.removeFormatting() 
      : segmentName;
    
    if (!splitData[splitType] || !splitData[splitType][floor] || splitData[splitType][floor][unformatted] === undefined) return null;
    
    return splitData[splitType][floor][unformatted];
  }

  static renderSplitHud(title, segments) {
    let maxNameWidth = 0;
    let maxTimeWidth = 0;
    
    segments.forEach(segment => {
      const nameWidth = Renderer.getStringWidth(segment.name);
      if (nameWidth > maxNameWidth) maxNameWidth = nameWidth;
      
      const timeStr = segment.timeStr || this.DEFAULT_TIMER_TEXT;
      const timeWidth = Renderer.getStringWidth(timeStr);
      if (timeWidth > maxTimeWidth) maxTimeWidth = timeWidth;
    });
    
    maxNameWidth += Renderer.getStringWidth("   ");
    
    let hudText = title + "\n";
    
    segments.forEach((segment, index) => {
      const paddedName = this.padToWidth(segment.name, maxNameWidth);
      const timeStr = segment.timeStr || this.DEFAULT_TIMER_TEXT;
      const alignedTime = this.rightAlignToWidth(timeStr, maxTimeWidth);
      
      hudText += paddedName + alignedTime;

      if (segment.comparisonText) hudText += segment.comparisonText;
      if (index < segments.length - 1) hudText += "\n";
    });
    
    return hudText;
  }

  static createSegment(options) {
    const {
      name,
      internalName,
      active = false,
      completed = false,
      timer = null,
      finalTime = null,
      isTotal = false,
      floor,
      splitType,
      splitData
    } = options;
    
    let timeStr = this.DEFAULT_TIMER_TEXT;
    let comparisonText = "";
    
    if (active && timer) {
      let currentTime;
      if (completed && finalTime !== null) currentTime = finalTime;
      if (timer.isRunning || timer.getTicks() > 0) currentTime = timer.getSeconds();
      else currentTime = 0;
      
      timeStr = `${this.ACTIVE_TIMER_COLOR}${this.formatTime(currentTime)}`;
      
      if (completed && finalTime !== null && floor && splitType && splitData) {
        const bestTimeMs = this.getBestSplit(splitType, floor, internalName || name, splitData);
        if (bestTimeMs !== null) {
          const timeMs = Math.floor(finalTime * 1000);
          comparisonText = this.getComparisonText(timeMs, bestTimeMs);
        }
      }
    }
    
    return {
      name,
      internalName: internalName || name,
      active,
      completed,
      timer,
      finalTime,
      isTotal,
      timeStr,
      comparisonText
    };
  }
  
  static createTimers(timerNames) {
    const timers = {};
    timerNames.forEach(name => timers[name] = new TickTimer());
    return timers;
  }
  
  static resetTimers(timerObj) {
    Object.values(timerObj).forEach(timer => {
      timer.stop();
      timer.reset();
    });
  }
  
  static createSplitTitle(type, floor) {
    const coloredFloor = floor.startsWith("M") ? "§c" : "§a";
    return `§6${type} Splits §7(${coloredFloor}§l${floor}§7)`;
  }
}