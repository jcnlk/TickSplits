import TickTimer from "./TickTimer";
import config from "../config";

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

  static formatRealtimeWithTick(timer, msDigits = 3) {
    if (!(timer instanceof TickTimer)) return this.DEFAULT_TIMER_TEXT;
    
    const realtimeSeconds = timer.getRealtimeSeconds();
    const tickSeconds = timer.getSeconds();
    
    const realtimeFormatted = this.formatTime(realtimeSeconds, msDigits);
    const tickFormatted = this.formatTime(tickSeconds, msDigits);
    
    return `${realtimeFormatted} (${tickFormatted})`;
  }

  static getDisplayTime(timer, finalRealtimeTime = null, finalTickTime = null, msDigits = 3) {
    const displayStyle = config.displayStyle;
    
    if (displayStyle === 0) { // Tick Time
      if (finalTickTime !== null) return this.formatTime(finalTickTime, msDigits);
      else if (timer instanceof TickTimer) return this.formatTime(timer.getSeconds(), msDigits);
    } else if (displayStyle === 1) { // Realtime
      if (finalRealtimeTime !== null) return this.formatTime(finalRealtimeTime, msDigits);
      else if (timer instanceof TickTimer) return this.formatTime(timer.getRealtimeSeconds(), msDigits);
    } else if (displayStyle === 2) { // Realtime + Tick
      if (finalRealtimeTime !== null && finalTickTime !== null) return `${this.formatTime(finalRealtimeTime, msDigits)} (${this.formatTime(finalTickTime, msDigits)})`;
      else if (timer instanceof TickTimer) return this.formatRealtimeWithTick(timer, msDigits);
    }
    
    return this.DEFAULT_TIMER_TEXT;
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
    if (bestTime === null || config.displayStyle === 2) return "";
    
    const diffFromBest = timeMs - bestTime;
    const prefix = diffFromBest < 0 ? "-" : "+";
    const color = diffFromBest < 0 ? this.PB_IMPROVED_COLOR : this.PB_WORSE_COLOR;
    
    return ` ${color}(${prefix}${this.formatTime(Math.abs(diffFromBest / 1000), msDigits)})`;
  }

  static saveBestSplit(splitType, floor, segmentName, tickTimeInSeconds, realtimeInSeconds, splitData) {
    const unformatted = typeof segmentName.removeFormatting === 'function' ? segmentName.removeFormatting() : segmentName;
    
    const tickTimeMs = Math.floor(tickTimeInSeconds * 1000);
    const realtimeMs = Math.floor(realtimeInSeconds * 1000);
    
    if (!splitData[splitType]) splitData[splitType] = {};
    if (!splitData[splitType][floor]) splitData[splitType][floor] = {};
    if (!splitData[splitType][floor][unformatted]) splitData[splitType][floor][unformatted] = {};
    
    const oldTickBest = splitData[splitType][floor][unformatted].tick;
    const oldRealtimeBest = splitData[splitType][floor][unformatted].realtime;
    
    let improvedTick = false;
    let improvedRealtime = false;
    
    if (oldTickBest === undefined || oldTickBest === null || tickTimeMs < oldTickBest) {
      splitData[splitType][floor][unformatted].tick = tickTimeMs;
      improvedTick = true;
    }
    
    if (oldRealtimeBest === undefined || oldRealtimeBest === null || realtimeMs < oldRealtimeBest) {
      splitData[splitType][floor][unformatted].realtime = realtimeMs;
      improvedRealtime = true;
    }
    
    if (improvedTick || improvedRealtime) splitData.save();
    
    return { improvedTick, improvedRealtime };
  }

  static getBestSplit(splitType, floor, segmentName, splitData) {
    const unformatted = typeof segmentName.removeFormatting === 'function' ? segmentName.removeFormatting() : segmentName;
    
    if (!splitData[splitType] || !splitData[splitType][floor] || !splitData[splitType][floor][unformatted]) return { tick: null, realtime: null };
    
    const data = splitData[splitType][floor][unformatted];
    return {
      tick: data.tick || null,
      realtime: data.realtime || null
    };
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
      finalTickTime = null,
      finalRealtimeTime = null,
      isTotal = false,
      floor,
      splitType,
      splitData
    } = options;
    
    let timeStr = this.DEFAULT_TIMER_TEXT;
    let comparisonText = "";
    
    if (active && timer) {
      if (completed && finalTickTime !== null && finalRealtimeTime !== null) timeStr = `${this.ACTIVE_TIMER_COLOR}${this.getDisplayTime(null, finalRealtimeTime, finalTickTime)}`;
      else if (timer.isRunning || timer.getTicks() > 0) timeStr = `${this.ACTIVE_TIMER_COLOR}${this.getDisplayTime(timer)}`;
      else timeStr = `${this.ACTIVE_TIMER_COLOR}${this.getDisplayTime(timer)}`;
      
      if (completed && finalTickTime !== null && finalRealtimeTime !== null && floor && splitType && splitData && config.displayStyle !== 2) {
        const bestTimes = this.getBestSplit(splitType, floor, internalName || name, splitData);
        
        if (config.displayStyle === 0) { // Tick Time
          if (bestTimes.tick !== null) {
            const timeMs = Math.floor(finalTickTime * 1000);
            comparisonText = this.getComparisonText(timeMs, bestTimes.tick);
          }
        } else if (config.displayStyle === 1) { // Realtime
          if (bestTimes.realtime !== null) {
            const timeMs = Math.floor(finalRealtimeTime * 1000);
            comparisonText = this.getComparisonText(timeMs, bestTimes.realtime);
          }
        }
      }
    }
    
    return {
      name,
      internalName: internalName || name,
      active,
      completed,
      timer,
      finalTickTime,
      finalRealtimeTime,
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