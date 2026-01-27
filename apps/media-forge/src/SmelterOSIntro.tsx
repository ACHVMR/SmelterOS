import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export const SmelterOSIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timings
  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const textOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const glowIntensity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const backgroundZoom = interpolate(frame, [0, 150], [1, 1.1], { extrapolateRight: "clamp" });

  // Molten glow pulse
  const pulseFrame = (frame % 60) / 60;
  const glowPulse = Math.sin(pulseFrame * Math.PI * 2) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        overflow: "hidden",
      }}
    >
      {/* Background Image with Zoom */}
      <AbsoluteFill
        style={{
          transform: `scale(${backgroundZoom})`,
          opacity: 0.6,
        }}
      >
        <Img
          src={staticFile("assets/world-labs/smelter-foundry-pano.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Dark Overlay Gradient */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at center, transparent 0%, rgba(10,10,10,0.8) 70%),
            linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.9) 100%)
          `,
        }}
      />

      {/* Molten Glow Effect */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          background: `radial-gradient(circle, rgba(255,77,0,${glowIntensity * glowPulse * 0.4}) 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />

      {/* Main Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Logo / Icon */}
        <div
          style={{
            fontSize: 120,
            transform: `scale(${logoSpring})`,
            marginBottom: 20,
            filter: `drop-shadow(0 0 ${30 * glowPulse}px rgba(255,77,0,0.8))`,
          }}
        >
          🔥
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 80,
            fontWeight: 900,
            color: "white",
            opacity: textOpacity,
            letterSpacing: -2,
            textShadow: `0 0 40px rgba(255,77,0,${glowPulse * 0.8})`,
            margin: 0,
          }}
        >
          <span style={{ color: "white" }}>SMELTER</span>
          <span
            style={{
              background: "linear-gradient(135deg, #FF4D00 0%, #FF8C00 50%, #FFB700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            OS
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 24,
            color: "#00C2B2",
            opacity: taglineOpacity,
            marginTop: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          FORGE YOUR AGENTS
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
            opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
            marginTop: 40,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Multi-agent orchestration platform powered by AI. 
          Build, deploy, and manage intelligent agents at scale.
        </p>
      </AbsoluteFill>

      {/* Bottom Tech Stack */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        {["AVVA NOON", "ACHEEVY", "CHICKEN HAWK", "WORLD LABS"].map((tech, i) => (
          <div
            key={tech}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
              opacity: interpolate(frame, [80 + i * 10, 100 + i * 10], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            {tech}
          </div>
        ))}
      </div>

      {/* Scanlines Effect */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
