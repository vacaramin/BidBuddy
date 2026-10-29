import { User } from "lucide-preact";
import { DEFAULT_PROFILE_COLOR, normalizeProfileColor } from "../utils/profiles";

const ProfileAvatar = ({
  color,
  name = "",
  size = 40,
  className = "",
}) => {
  const label = name.trim() || "Profile";
  const initial = label.charAt(0).toUpperCase();
  const background = normalizeProfileColor(color || DEFAULT_PROFILE_COLOR);
  const fontSize = Math.max(11, Math.round(size * 0.4));
  const iconSize = Math.max(14, Math.round(size * 0.45));

  return (
    <span
      className={`profile-avatar ${className}`.trim()}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background,
        color: "#ffffff",
        display: "inline-grid",
        placeItems: "center",
        borderRadius: "50%",
        overflow: "hidden",
        lineHeight: 0,
        flexShrink: 0,
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {initial ? (
        <span
          style={{
            display: "block",
            color: "#ffffff",
            fontSize,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 0,
            textTransform: "uppercase",
            // Optical vertical centering for capital glyphs
            transform: "translateY(0.06em)",
          }}
        >
          {initial}
        </span>
      ) : (
        <User size={iconSize} />
      )}
    </span>
  );
};

export default ProfileAvatar;
