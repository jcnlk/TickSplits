import { LocalStore } from "../../tska/storage/LocalStore";

const defaultData = {
  bossSplitsGui: {
    x: 0,
    y: 0,
    scale: 1
  },
  clearSplitsHud: {
    x: 0.8, 
    y: 0, 
    scale: 1
  }
}

export const data = new LocalStore("TickSplits/data", defaultData, "data.json");