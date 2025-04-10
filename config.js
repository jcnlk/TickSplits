import { @Vigilant, @SwitchProperty, @ButtonProperty } from "Vigilance";

const moduleVersion = JSON.parse(FileLib.read("TickSplits", "metadata.json")).version;
const moduleAuthor = JSON.parse(FileLib.read("TickSplits", "metadata.json")).author;
const configHeader = `&8[&6BetterSplits&8] &ev${moduleVersion} \nMade by ${moduleAuthor}`;

@Vigilant("TickSplits", "§6TickSplits")

class Config {
    @SwitchProperty({
        name: "Boss Splits",
        description: "Show boss splits.",
        category: "General",
    })
    bossSplits = true;

    @SwitchProperty({
        name: "Clear Splits",
        description: "Show clear splits.",
        category: "General"
    })
    clearSplits = true;

    @ButtonProperty({
        name: "Edit HUD Positions",
        description: "Open the HUD editor to customize position and scale of all HUD elements.",
        placeholder: "Open Editor",
        category: "General",
    })
    openHudGui() {
        ChatLib.command("ts hud", true);
    }

    constructor() {
        this.initialize(this);

        this.setCategoryDescription("General", `${configHeader}\n\n&7&oRelated Commands: /bs hud`);

    }
}

export default new Config();