import { useEffect, useMemo, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Gauge, PlayCircle, ShieldCheck } from 'lucide-react';
import './VideoPlayer.css';

const buildSignedSource = (source) => {
  if (!source?.src || !source?.token) {
    return source;
  }

  try {
    const url = new URL(source.src, window.location.origin);
    url.searchParams.set('token', source.token);
    return { ...source, src: url.toString() };
  } catch {
    return source;
  }
};

export default function VideoPlayer({
  title = 'Lesson player',
  poster,
  src,
  sources = [],
  playbackRates = [0.75, 1, 1.25, 1.5, 2],
}) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [selectedQuality, setSelectedQuality] = useState('auto');

  const normalizedSources = useMemo(() => {
    const sourceList = sources.length
      ? sources.map((source) => ({
          label: source.label ?? 'Auto',
          type: source.type ?? 'application/x-mpegURL',
          ...buildSignedSource(source),
        }))
      : [
          {
            label: 'Auto',
            src,
            type: 'application/x-mpegURL',
          },
        ];

    return sourceList.filter((sourceItem) => Boolean(sourceItem.src));
  }, [sources, src]);

  const activeSource = useMemo(() => {
    return (
      normalizedSources.find((sourceItem) => sourceItem.label === selectedQuality) ??
      normalizedSources[0]
    );
  }, [normalizedSources, selectedQuality]);

  useEffect(() => {
    if (!videoRef.current || !activeSource) {
      return undefined;
    }

    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        preload: 'auto',
        playbackRates,
        poster,
        sources: [activeSource],
      });
    } else {
      const player = playerRef.current;
      const currentTime = player.currentTime() ?? 0;
      const wasPlaying = !player.paused();

      player.poster(poster ?? '');
      player.playbackRates(playbackRates);
      player.src([activeSource]);
      player.ready(() => {
        player.currentTime(currentTime);
        if (wasPlaying) {
          player.play().catch(() => {});
        }
      });
    }

    return () => {};
  }, [activeSource, playbackRates, poster]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!normalizedSources.length) {
      return;
    }

    const hasSelectedSource = normalizedSources.some(
      (sourceItem) => sourceItem.label === selectedQuality,
    );

    if (!hasSelectedSource) {
      setSelectedQuality(normalizedSources[0].label);
    }
  }, [normalizedSources, selectedQuality]);

  return (
    <div className="video-player-shell rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white shadow-xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">Video.js</p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Signed URL, playback speed, va quality selector bir joyda boshqariladi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="video-player-control">
            <span>Quality</span>
            <select value={selectedQuality} onChange={(event) => setSelectedQuality(event.target.value)}>
              {normalizedSources.map((sourceItem) => (
                <option key={sourceItem.label} value={sourceItem.label}>
                  {sourceItem.label}
                </option>
              ))}
            </select>
          </label>
          <div className="video-player-pill">
            <Gauge className="h-4 w-4 text-indigo-300" />
            <span>{playbackRates.join('x · ')}x</span>
          </div>
        </div>
      </div>

      <div data-vjs-player className="overflow-hidden rounded-2xl">
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <div className="video-player-pill">
          <PlayCircle className="h-4 w-4 text-indigo-300" />
          <span>Adaptive player</span>
        </div>
        <div className="video-player-pill">
          <span>Active source: {activeSource?.label ?? 'Auto'}</span>
        </div>
      </div>
    </div>
  );
}
