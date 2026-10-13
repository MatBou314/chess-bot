import { botList } from "./allBots.js";
import { Chess } from "https://esm.sh/chess.js";

self.onmessage = function(event) {
    const { botId, fen, maxTime, requestId} = event.data;
    const botFunction = botList[botId];
    if (!botFunction) {
      self.postMessage({ error: `Bot '${botId}' not found`, requestId });
      return;
    }
    const move = botFunction(new Chess(fen), maxTime);
    self.postMessage({move, requestId});
}