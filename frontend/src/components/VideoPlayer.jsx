import { useCallback, useEffect, useRef, useState } from "react";

import { videoPlayerApi } from "../lib/videoPlayerApi";
import { keyboardAction, PLAYER_SPEEDS, shouldResume } from "../lib/videoPlayerLogic";
import "./VideoPlayer.css";

export default function VideoPlayer({ src, lessonId, token, storageKey, onEnded, poster }) {
  const videoRef = useRef(null);
  const shellRef = useRef(null);
  const saveTimer = useRef(null);
  const [manifest, setManifest] = useState(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(Boolean(lessonId));

  useEffect(() => {
    if (!lessonId || !token) {
      setManifest(src ? { sources: [{ label: "Auto", url: src, type: "video/mp4" }], subtitles: [] } : null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    videoPlayerApi.manifest(lessonId, token)
      .then((data) => active && setManifest(data))
      .catch((reason) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [lessonId, token, src, retry]);

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.currentTime) return;
    const body = {
      position_seconds: Math.floor(video.currentTime),
      duration_seconds: Math.floor(Number.isFinite(video.duration) ? video.duration : 0),
    };
    if (storageKey) localStorage.setItem(storageKey, String(body.position_seconds));
    if (lessonId && token) videoPlayerApi.save(lessonId, body, token).catch(() => null);
  }, [lessonId, storageKey, token]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !manifest) return undefined;
    const onMetadata = () => {
      const saved = manifest.resume_seconds ?? Number(localStorage.getItem(storageKey));
      if (shouldResume(saved, video.duration)) video.currentTime = Number(saved);
    };
    const onTime = () => {
      if (!saveTimer.current) {
        saveTimer.current = window.setTimeout(() => {
          saveProgress();
          saveTimer.current = null;
        }, 15000);
      }
    };
    video.addEventListener("loadedmetadata", onMetadata);
    video.addEventListener("timeupdate", onTime);
    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.removeEventListener("timeupdate", onTime);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveProgress();
    };
  }, [manifest, saveProgress, storageKey]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => null);
    else video.pause();
  };

  const fullscreen = () => shellRef.current?.requestFullscreen?.();
  const pip = () => videoRef.current?.requestPictureInPicture?.().catch(() => null);

  const onKeyDown = (event) => {
    const action = keyboardAction(event.key);
    if (!action) return;
    event.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    if (action === "toggle") togglePlayback();
    if (action === "backward") video.currentTime = Math.max(0, video.currentTime - 10);
    if (action === "forward") video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
    if (action === "fullscreen") fullscreen();
    if (action === "pip") pip();
    if (action === "mute") video.muted = !video.muted;
    if (action === "captions" && video.textTracks[0]) {
      video.textTracks[0].mode = video.textTracks[0].mode === "showing" ? "hidden" : "showing";
    }
  };

  if (loading) return <div className="video-player-state">Video tayyorlanmoqda...</div>;
  if (error) return <div className="video-player-state" role="alert"><b>Video ochilmadi</b><span>{error}</span><button onClick={() => setRetry((value) => value + 1)}>Qayta urinish</button></div>;
  if (!manifest?.sources?.length) return <div className="video-player-state">Bu dars videosi mavjud emas.</div>;

  const selected = manifest.sources[sourceIndex] || manifest.sources[0];
  return (
    <section className="video-player-shell" ref={shellRef} tabIndex="0" onKeyDown={onKeyDown} aria-label="Video player">
      <video ref={videoRef} key={selected.url} src={selected.url} poster={poster} controls playsInline preload="metadata" onEnded={() => { saveProgress(); onEnded?.(); }} onError={() => setError("Media manbasi javob bermadi. Boshqa sifatni tanlang yoki qayta urining.")}>
        {(manifest.subtitles || []).map((track) => <track key={`${track.srclang}-${track.src}`} kind="subtitles" src={track.src} srcLang={track.srclang} label={track.label} default={track.default} />)}
      </video>
      <div className="video-player-toolbar">
        <label>Sifat<select value={sourceIndex} onChange={(event) => { saveProgress(); setSourceIndex(Number(event.target.value)); }}>
          {manifest.sources.map((source, index) => <option value={index} key={`${source.label}-${source.url}`}>{source.label}</option>)}
        </select></label>
        <label>Tezlik<select value={speed} onChange={(event) => { const value = Number(event.target.value); setSpeed(value); videoRef.current.playbackRate = value; }}>
          {PLAYER_SPEEDS.map((value) => <option key={value} value={value}>{value}x</option>)}
        </select></label>
        <button type="button" onClick={pip}>PiP</button>
        <button type="button" onClick={fullscreen}>To‘liq ekran</button>
        <span>Space/K: play · ←/→: 10s · F: fullscreen · P: PiP · C: subtitr</span>
      </div>
    </section>
  );
}
