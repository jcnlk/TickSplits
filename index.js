import { CommandHandler } from "../tska/command/CommandHandler";
import HudManager from "./utils/hud";
import "./features/ClearSplits";
import "./features/BossSplits";
import config from "./config";

const commandHandler = new CommandHandler("TickSplits").setName("ts", (args) => {
  if (args !== undefined) return;
  config.openGUI()
});

commandHandler.pushWithAlias("hud", ["huds", "edit"], "Open the HUDs editor.", () => HudManager.openGui());