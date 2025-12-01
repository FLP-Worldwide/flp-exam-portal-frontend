"use client";

import { useEffect, useRef, useState } from "react";

const Player = ({ src }) => {
  const audioRef = useRef(null);
  const [hasPlayed, setHasPlayed] = useState(false); // already started once?
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    if (!audioRef.current) return;
    if (hasPlayed) return;         // ❌ no second play

    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setHasPlayed(true);
    }).catch((err) => {
      console.error("Audio play error:", err);
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-3">
      {/* Hidden native player: no controls, only programmatic control */}
      <audio ref={audioRef} src={src} preload="auto" />

      <button
        type="button"
        onClick={handlePlayClick}
        disabled={hasPlayed}
        className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm
          ${hasPlayed
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
      >
        {hasPlayed ? (isPlaying ? "Wird abgespielt…" : "Schon abgespielt") : "Audio abspielen"}
      </button>
    </div>
  );
};

export default Player;
