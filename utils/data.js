import { LocalStore } from "../../tska/storage/LocalStore";

const defaultData = {
  bossSplitsGui: {
    x: 0.1,
    y: 0.07,
    scale: 1
  },
  clearSplitsHud: {
    x: 0.9, 
    y: 0.06, 
    scale: 1.0
  }
}

export const data = new LocalStore("BetterSplits/data", defaultData, "data.json");