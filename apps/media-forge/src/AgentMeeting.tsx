import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence } from "remotion";

interface Character {
  name: string;
  role: string;
  image: string;
  color: string;
}

const characters: Character[] = [
  { name: "AVVA NOON", role: "The Brain", image: "assets/avva-noon.png", color: "#00C2B2" },
  { name: "ACHEEVY", role: "The Executor", image: "assets/acheevy.jpg", color: "#FF8C00" },
  { name: "CHICKEN HAWK", role: "The Coder", image: "assets/chicken-hawk.png", color: "#22C55E" },
];

export const AgentMeeting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene phases
  const introEnd = 60;
  const meetingStart = 60;
  const meetingEnd = 180;
  const outroStart = 180;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      {/* Background - SmelterOS HQ */}
      <AbsoluteFill style={{ opacity: 0.4 }}>
        <Img
          src={staticFile("assets/world-labs/smelter-foundry-pano.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.9) 100%)",
        }}
      />

      {/* Intro Sequence - SmelterOS HQ Title */}
      <Sequence from={0} durationInFrames={introEnd}>
        <IntroTitle frame={frame} fps={fps} />
      </Sequence>

      {/* Meeting Sequence - Characters Appear */}
      <Sequence from={meetingStart} durationInFrames={meetingEnd - meetingStart}>
        <MeetingScene frame={frame - meetingStart} fps={fps} />
      </Sequence>

      {/* Outro - Team Assembled */}
      <Sequence from={outroStart}>
        <OutroScene frame={frame - outroStart} fps={fps} />
      </Sequence>

      {/* Scanlines */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

function IntroTitle({ frame, fps }: { frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [40, 60], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: opacity * fadeOut,
      }}
    >
      <div style={{ fontSize: 80, transform: `scale(${scale})`, marginBottom: 20 }}>🏢</div>
      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 60,
          fontWeight: 900,
          color: "white",
          textShadow: "0 0 40px rgba(255,77,0,0.5)",
          margin: 0,
        }}
      >
        SMELTEROS HQ
      </h1>
      <p
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 20,
          color: "#00C2B2",
          marginTop: 20,
          letterSpacing: 4,
        }}
      >
        AGENT ASSEMBLY
      </p>
    </AbsoluteFill>
  );
}

function MeetingScene({ frame, fps }: { frame: number; fps: number }) {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingBottom: 100,
        gap: 60,
      }}
    >
      {characters.map((char, index) => {
        const delay = index * 20;
        const slideUp = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } });
        const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

        return (
          <div
            key={char.name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `translateY(${(1 - slideUp) * 200}px)`,
              opacity,
            }}
          >
            {/* Character Image */}
            <div
              style={{
                width: 350,
                height: 350,
                borderRadius: 20,
                overflow: "hidden",
                border: `3px solid ${char.color}`,
                boxShadow: `0 0 40px ${char.color}40`,
              }}
            >
              <Img
                src={staticFile(char.image)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Name Tag */}
            <div
              style={{
                marginTop: 20,
                padding: "10px 30px",
                background: `${char.color}20`,
                border: `1px solid ${char.color}`,
                borderRadius: 10,
              }}
            >
              <h3
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 18,
                  color: char.color,
                  margin: 0,
                  letterSpacing: 2,
                }}
              >
                {char.name}
              </h3>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                {char.role}
              </p>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function OutroScene({ frame, fps }: { frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const pulseFrame = (frame % 60) / 60;
  const glowPulse = Math.sin(pulseFrame * Math.PI * 2) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: `radial-gradient(circle, rgba(255,77,0,${glowPulse * 0.3}) 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />

      <div style={{ fontSize: 100, transform: `scale(${scale})`, marginBottom: 20 }}>🔥</div>
      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 70,
          fontWeight: 900,
          color: "white",
          textShadow: `0 0 40px rgba(255,77,0,${glowPulse})`,
          margin: 0,
        }}
      >
        <span style={{ color: "white" }}>TEAM </span>
        <span
          style={{
            background: "linear-gradient(135deg, #FF4D00, #FFB700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ASSEMBLED
        </span>
      </h1>
      <p
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 24,
          color: "#00C2B2",
          marginTop: 30,
          letterSpacing: 3,
        }}
      >
        SMELTEROS • INTELLIGENCE FORGED
      </p>
    </AbsoluteFill>
  );
}
