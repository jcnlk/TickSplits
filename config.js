import { @Vigilant, @SwitchProperty, @ButtonProperty, @SelectorProperty } from "Vigilance";

const moduleVersion = JSON.parse(FileLib.read("TickSplits", "metadata.json")).version;
const moduleAuthor = JSON.parse(FileLib.read("TickSplits", "metadata.json")).author;
const configHeader = `&8[&6BetterSplits&8] &ev${moduleVersion} \nMade by ${moduleAuthor}`;

@Vigilant("TickSplits", "§6TickSplits")

class Config {
    @SwitchProperty({
        name: "Boss Splits",
        description: "Show boss splits.",
        category: "General",
        subcategory: "General"
    })
    bossSplits = true;

    @SwitchProperty({
        name: "Clear Splits",
        description: "Show clear splits.",
        category: "General",
        subcategory: "General"
    })
    clearSplits = true;

    @SelectorProperty({
        name: "Display Style",
        description: "Choose how split times are displayed.\nTick Time: Server tick-based timing only\nRealtime: Real-world time with PB comparisons\nRealtime + Tick: Shows both times without comparisons",
        category: "General",
        subcategory: "General",
        options: ["Tick Time", "Realtime", "Realtime + Tick"]
    })
    displayStyle = 0;

    @ButtonProperty({
        name: "Edit HUD Positions",
        description: "Open the HUD editor to customize position and scale of all HUD elements.",
        placeholder: "Open Editor",
        category: "General",
        subcategory: "General"
    })
    openHudGui() {
        ChatLib.command("ts hud", true);
    }

    constructor() {
        this.initialize(this);

        this.setCategoryDescription("General", `${configHeader}\n\n&7&oRelated Commands: &b/ts hud`);
    }
}

export default new Config();