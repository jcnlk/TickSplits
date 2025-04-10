export default class TickTimer {
    constructor() {
      this.ticks = 0;
      this.isRunning = false;
      this.startTime = null;
      this.pausedTime = 0;
      
      this.tickCounter = register("packetReceived", () => {
        if (this.isRunning) this.ticks++;
      }).setFilteredClass(Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction"));
    }
    
    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.startTime = Date.now() - this.pausedTime;
        this.tickCounter.register();
      }
      return this;
    }
    
    stop() {
      if (this.isRunning) {
        this.isRunning = false;
        this.pausedTime = Date.now() - this.startTime;
        this.tickCounter.unregister();
      }
      return this;
    }
    
    reset() {
      this.ticks = 0;
      this.pausedTime = 0;
      this.startTime = this.isRunning ? Date.now() : null;
      return this;
    }
    
    restart() {
      this.reset();
      this.start();
      return this;
    }
    
    getTicks() {
      return this.ticks;
    }
    
    getSeconds() {
      return this.ticks / 20;
    }
    
    getFormattedTime() {
      const totalSeconds = this.ticks / 20;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);
      const milliseconds = Math.floor((totalSeconds % 1) * 100);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
  }