import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence } from "remotion";

// Character data
const CHARACTERS = {
  avvaNoon: { name: "AVVA NOON", image: "assets/avva-noon.png" },
  acheevy: { name: "ACHEEVY", image: "assets/acheevy.jpg" },
  chickenHawk: { name: "CHICKEN HAWK", image: "assets/chicken-hawk.png" },
  momHawk: { name: "MOM HAWK", image: "assets/mom-hawk.png" },
  dadHawk: { name: "DAD HAWK", image: "assets/dad-hawk.png" },
};

// Dialogue entries
interface DialogueLine {
  character: keyof typeof CHARACTERS;
  text: string;
  duration: number; // in frames
}

const script: DialogueLine[] = [
  { character: "avvaNoon", text: "Welcome! Today we're onboarding our newest agent—", duration: 90 },
  { character: "acheevy", text: "Codename: CHICKEN HAWK. Specialty: Autonomous coding.", duration: 90 },
  { character: "chickenHawk", text: "Alright, I'm here! Let's get coding! Where's my terminal?", duration: 90 },
  { character: "avvaNoon", text: "Such enthusiasm! Welcome to SmelterOS!", duration: 75 },
  { character: "chickenHawk", text: "Yeah, yeah, nice brain. Very wrinkly. Where do I sit?", duration: 90 },
  { character: "momHawk", text: "SWEETIE! You forgot your lunch! Worm sandwiches!", duration: 90 },
  { character: "dadHawk", text: "Son, we need to talk about your 401k contributions.", duration: 90 },
  { character: "chickenHawk", text: "Oh no... Please pretend they're not here...", duration: 75 },
  { character: "acheevy", text: "ALERT: Two unregistered entities detected.", duration: 75 },
  { character: "momHawk", text: "What an ADORABLE robot! Does he come with a gift receipt?", duration: 90 },
  { character: "dadHawk", text: "My boy placed THIRD in the Nest Code Jam. THIRD!", duration: 90 },
  { character: "chickenHawk", text: "I AM NOT FARMING WORMS, DAD!", duration: 75 },
  { character: "avvaNoon", text: "Welcome to Team SmelterOS, Chicken Hawk!", duration: 90 },
  { character: "chickenHawk", text: "FINALLY! Let's DESTROY some bugs!", duration: 75 },
  { character: "acheevy", text: "Deploying workspace. Status: OPERATIONAL.", duration: 90 },
];

export const ChickenHawkFirstDay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate cumulative frame positions for each dialogue
  let cumulativeFrames = 0;
  const dialogueTimings = script.map((line) => {
    const start = cumulativeFrames;
    cumulativeFrames += line.duration;
    return { ...line, start, end: cumulativeFrames };
  });

  // Find current dialogue
  const currentDialogue = dialogueTimings.find(
    (d) => frame >= d.start && frame < d.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0A" }}>
      {/* Background - SmelterOS Lobby */}
      <AbsoluteFill>
        <Img
          src={staticFile("assets/smelteros-lobby.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Dark overlay for readability */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.5) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Title Card - First 60 frames */}
      <Sequence from={0} durationInFrames={60}>
        <TitleCard frame={frame} fps={fps} />
      </Sequence>

      {/* Main Episode - After title */}
      <Sequence from={60}>
        <AbsoluteFill>
          {/* Character Display */}
          {currentDialogue && (
            <CharacterDisplay
              character={CHARACTERS[currentDialogue.character]}
              frame={frame - 60}
              fps={fps}
              dialogueStart={currentDialogue.start - 60}
            />
          )}

          {/* Dialogue Box */}
          {currentDialogue && (
            <DialogueBox
              characterName={CHARACTERS[currentDialogue.character].name}
              text={currentDialogue.text}
              frame={frame - 60}
              dialogueStart={currentDialogue.start - 60}
              fps={fps}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* End Card */}
      <Sequence from={60 + cumulativeFrames}>
        <EndCard frame={frame - 60 - cumulativeFrames} fps={fps} />
      </Sequence>
    </AbsoluteFill>
  );
};

function TitleCard({ frame, fps }: { frame: number; fps: number }) {
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [45, 60], [1, 0], { extrapolateRight: "clamp" });

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
      <div style={{ fontSize: 60, marginBottom: 20, transform: `scale(${scale})` }}>🔥</div>
      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 50,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          margin: 0,
        }}
      >
        SMELTEROS PRESENTS
      </h1>
      <h2
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 30,
          color: "#FF8C00",
          marginTop: 20,
        }}
      >
        "Chicken Hawk's First Day"
      </h2>
    </AbsoluteFill>
  );
}

function CharacterDisplay({
  character,
  frame,
  fps,
  dialogueStart,
}: {
  character: { name: string; image: string };
  frame: number;
  fps: number;
  dialogueStart: number;
}) {
  const localFrame = frame - dialogueStart;
  const bounceIn = spring({ frame: localFrame, fps, config: { damping: 15, stiffness: 150 } });
  const opacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Subtle idle animation
  const idleBob = Math.sin(frame * 0.1) * 5;

  return (
    <div
      style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: `translateX(-50%) translateY(${idleBob}px) scale(${bounceIn})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 20,
          overflow: "hidden",
          border: "4px solid #FF8C00",
          boxShadow: "0 0 40px rgba(255,140,0,0.5)",
        }}
      >
        <Img
          src={staticFile(character.image)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
}

function DialogueBox({
  characterName,
  text,
  frame,
  dialogueStart,
  fps,
}: {
  characterName: string;
  text: string;
  frame: number;
  dialogueStart: number;
  fps: number;
}) {
  const localFrame = frame - dialogueStart;
  const slideUp = spring({ frame: localFrame, fps, config: { damping: 20, stiffness: 100 } });
  const opacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Typewriter effect
  const charsToShow = Math.floor(interpolate(localFrame, [5, 60], [0, text.length], { 
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp" 
  }));
  const displayText = text.slice(0, charsToShow);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 100,
        right: 100,
        transform: `translateY(${(1 - slideUp) * 50}px)`,
        opacity,
      }}
    >
      {/* Name Tag */}
      <div
        style={{
          display: "inline-block",
          padding: "8px 20px",
          background: "#FF8C00",
          borderRadius: "8px 8px 0 0",
          marginLeft: 20,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 16,
            fontWeight: 700,
            color: "#0A0A0A",
            letterSpacing: 2,
          }}
        >
          {characterName}
        </span>
      </div>

      {/* Dialogue Box */}
      <div
        style={{
          background: "rgba(10,10,10,0.95)",
          border: "3px solid #FF8C00",
          borderRadius: "0 16px 16px 16px",
          padding: "30px 40px",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 28,
            color: "white",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {displayText}
          <span style={{ opacity: localFrame % 30 < 15 ? 1 : 0 }}>▊</span>
        </p>
      </div>
    </div>
  );
}

function EndCard({ frame, fps }: { frame: number; fps: number }) {
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
        background: "rgba(10,10,10,0.95)",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          background: `radial-gradient(circle, rgba(255,77,0,${glowPulse * 0.4}) 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />
      <div style={{ fontSize: 80, transform: `scale(${scale})`, marginBottom: 20 }}>🔥</div>
      <h1
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 50,
          fontWeight: 900,
          color: "white",
          margin: 0,
        }}
      >
        <span>SMELTER</span>
        <span style={{ color: "#FF8C00" }}>OS</span>
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
        INTELLIGENCE FORGED
      </p>
    </AbsoluteFill>
  );
}
