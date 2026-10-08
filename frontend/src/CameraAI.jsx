import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

function iou(boxA, boxB) {
  const [ax, ay, aw, ah] = boxA;
  const [bx, by, bw, bh] = boxB;

  const ax2 = ax + aw;
  const ay2 = ay + ah;
  const bx2 = bx + bw;
  const by2 = by + bh;

  const ix1 = Math.max(ax, bx);
  const iy1 = Math.max(ay, by);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);

  const iw = Math.max(0, ix2 - ix1);
  const ih = Math.max(0, iy2 - iy1);
  const intersection = iw * ih;

  const areaA = aw * ah;
  const areaB = bw * bh;
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

function centerDistance(boxA, boxB) {
  const ax = boxA[0] + boxA[2] / 2;
  const ay = boxA[1] + boxA[3] / 2;

  const bx = boxB[0] + boxB[2] / 2;
  const by = boxB[1] + boxB[3] / 2;

  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export default function CameraAI({ busPassengers, capacity, onVerificationChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const animationRef = useRef(null);

  const tracksRef = useRef([]);
  const nextTrackIdRef = useRef(1);
  const frameRef = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState("");

  async function startCamera() {
    try {
      setError("");
      setLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!modelRef.current) {
        modelRef.current = await cocoSsd.load();
      }

      tracksRef.current = [];
      nextTrackIdRef.current = 1;
      frameRef.current = 0;

      setCameraOn(true);
      setLoading(false);

      detectPeople();
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(
        "Camera access failed. Allow webcam permission in the browser and try again."
      );
    }
  }

  function stopCamera() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    tracksRef.current = [];
    setCameraOn(false);
    setPeopleCount(0);
    setConfidence(0);
  }

  async function detectPeople() {
    if (!videoRef.current || !modelRef.current) return;

    try {
      frameRef.current += 1;

      /*
       * Run the neural-network detector every 3rd animation frame.
       * The tracker keeps people alive between detections.
       */
      if (frameRef.current % 3 === 0) {
        const predictions = await modelRef.current.detect(videoRef.current);

        const detections = predictions
          .filter((prediction) => {
            if (prediction.class !== "person") return false;

            /*
             * Use a stricter threshold because this is intended
             * for visual occupancy verification.
             */
            if (prediction.score < 0.65) return false;

            const [x, y, width, height] = prediction.bbox;

            /*
             * A passenger/person should normally have a clearly
             * vertical body-shaped bounding box.
             *
             * This rejects many partial-object false positives,
             * including hands and arms close to the camera.
             */
            const aspectRatio = height / Math.max(width, 1);

            if (aspectRatio < 0.75) return false;

            /*
             * Require a meaningful vertical body extent.
             */
            const frameHeight = Math.max(
              videoRef.current.videoHeight,
              1
            );

            if (height < frameHeight * 0.20) return false;

            /*
             * Ignore tiny detections.
             */
            const frameArea =
              Math.max(videoRef.current.videoWidth, 1) *
              frameHeight;

            const boxArea = width * height;

            if (boxArea / frameArea < 0.02) return false;

            return true;
          })
          .map((prediction) => ({
            bbox: prediction.bbox,
            score: prediction.score,
            matched: false,
          }));

        const tracks = tracksRef.current;

        /*
         * Match new detections to existing tracks using IoU first,
         * then center distance as a fallback.
         */
        for (const detection of detections) {
          let bestTrack = null;
          let bestScore = 0;

          for (const track of tracks) {
            if (track.matched) continue;

            const overlap = iou(detection.bbox, track.bbox);
            const distance = centerDistance(detection.bbox, track.bbox);

            let matchScore = overlap;

            if (overlap < 0.15 && distance < 100) {
              matchScore = 0.2;
            }

            if (matchScore > bestScore) {
              bestScore = matchScore;
              bestTrack = track;
            }
          }

          if (bestTrack && bestScore >= 0.15) {
            bestTrack.bbox = detection.bbox;
            bestTrack.score = detection.score;
            bestTrack.missed = 0;
            bestTrack.matched = true;
            bestTrack.confirmations += 1;

            if (bestTrack.confirmations >= 2) {
              bestTrack.confirmed = true;
            }
          } else {
            /*
             * New detections must survive multiple detector cycles
             * before becoming an official tracked person.
             */
            tracks.push({
              id: nextTrackIdRef.current++,
              bbox: detection.bbox,
              score: detection.score,
              missed: 0,
              matched: true,
              confirmations: 1,
              confirmed: false,
            });
          }
        }

        /*
         * Keep tracks alive for a few missed detections.
         * This prevents people disappearing from the count because
         * of one or two bad frames.
         */
        for (const track of tracks) {
          if (!track.matched) {
            track.missed += 1;
          }

          track.matched = false;
        }

        tracksRef.current = tracks.filter((track) => track.missed <= 5);

        const activeTracks = tracksRef.current;
        const confirmedTracks = activeTracks.filter(
          (track) => track.confirmed
        );

        setPeopleCount(confirmedTracks.length);

        if (confirmedTracks.length > 0) {
          const averageConfidence =
            confirmedTracks.reduce((sum, track) => sum + track.score, 0) /
            confirmedTracks.length;

          setConfidence(Math.round(averageConfidence * 100));
        } else {
          setConfidence(0);
        }
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video) {
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const displayTracks = [...tracksRef.current].sort(
          (a, b) => a.bbox[0] - b.bbox[0]
        );

        displayTracks.forEach((track, index) => {
          const [x, y, width, height] = track.bbox;

          ctx.strokeStyle = "#00ff88";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = "#00ff88";
          ctx.font = "bold 15px Arial";
          ctx.fillText(
            `Person #${index + 1} ${Math.round(track.score * 100)}%`,
            x,
            Math.max(18, y - 6)
          );
        });
      }
    } catch (err) {
      console.error("Camera detection error:", err);
    }

    animationRef.current = requestAnimationFrame(detectPeople);
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const cameraVisiblePeople = peopleCount;
  const difference = Math.abs(busPassengers - cameraVisiblePeople);

  const verificationStatus =
    cameraVisiblePeople === 0
      ? "NO VISUAL DATA"
      : cameraVisiblePeople === busPassengers
        ? "CAMERA COUNT ALIGNED"
        : cameraVisiblePeople < busPassengers
          ? "LIMITED CAMERA COVERAGE"
          : "COUNT CHECK REQUIRED";

  const verificationMessage =
    verificationStatus === "CAMERA COUNT ALIGNED"
      ? "Camera-visible count matches the system occupancy."
      : verificationStatus === "LIMITED CAMERA COVERAGE"
        ? "Camera sees fewer people than the system count. Coverage may be partial."
        : verificationStatus === "NO VISUAL DATA"
          ? "Start the camera to begin visual verification."
          : "Camera detected more people than the system count. Verify the occupancy source.";

  useEffect(() => {
    if (onVerificationChange) {
      onVerificationChange({
        cameraOn,
        cameraVisiblePeople,
        confidence,
        verificationStatus,
        difference,
      });
    }
  }, [
    onVerificationChange,
    cameraOn,
    cameraVisiblePeople,
    confidence,
    verificationStatus,
    difference,
  ]);

  return (
    <article className="card camera-card">
      <div className="card-title">CAMERA AI</div>

      <div className="camera-preview">
        <video
          ref={videoRef}
          className="camera-video"
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          className="camera-overlay"
        />

        {!cameraOn && !loading && (
          <div className="camera-placeholder">
            <div className="camera-icon">📷</div>
            <strong>Camera inactive</strong>
            <span>Enable camera to detect people</span>
          </div>
        )}

        {loading && (
          <div className="camera-placeholder">
            <strong>Loading AI model...</strong>
            <span>Preparing person detection</span>
          </div>
        )}
      </div>

      <div className="camera-controls">
        {!cameraOn ? (
          <button onClick={startCamera} disabled={loading}>
            {loading ? "Loading..." : "Start Camera AI"}
          </button>
        ) : (
          <button className="danger" onClick={stopCamera}>
            Stop Camera
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="camera-stats">
        <div>
          <span>People tracked</span>
          <strong>{peopleCount}</strong>
        </div>

        <div>
          <span>Avg. confidence</span>
          <strong>{confidence}%</strong>
        </div>

        <div>
          <span>Camera-visible people</span>
          <strong>{cameraVisiblePeople}</strong>
        </div>

        <div>
          <span>System count</span>
          <strong>{busPassengers}</strong>
        </div>
      </div>

      <div className="verification-panel">
        <div>
          <span className="verification-label">OCCUPANCY VERIFICATION</span>
          <strong className={`verification-status ${verificationStatus === "CAMERA COUNT ALIGNED" ? "verified" : verificationStatus === "NO VISUAL DATA" ? "neutral" : "warning"}`}>
            {verificationStatus}
          </strong>
        </div>

        <div className="verification-detail">
          <span>Count difference</span>
          <strong>{difference}</strong>
        </div>

        <p>{verificationMessage}</p>
      </div>

      <p className="muted">
        COCO-SSD person detection + temporal tracking. Camera is a visual verification source, not the authoritative passenger counter.
      </p>
    </article>
  );
}






