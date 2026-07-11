export const PLAYER_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function shouldResume(saved, duration) {
  return Number(saved) > 0 && (!duration || Number(saved) < Number(duration) - 5);
}

export function keyboardAction(key) {
  const actions = {
    " ": "toggle",
    k: "toggle",
    ArrowLeft: "backward",
    ArrowRight: "forward",
    f: "fullscreen",
    p: "pip",
    m: "mute",
    c: "captions",
  };
  return actions[key] || null;
}
