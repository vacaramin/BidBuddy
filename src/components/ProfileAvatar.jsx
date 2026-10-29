import { User } from "lucide-preact";

const ProfileAvatar = ({ photo, name = "", size = 40, className = "" }) => {
  const label = name.trim() || "Profile";
  const initial = label.charAt(0).toUpperCase();

  if (photo) {
    return (
      <img
        className={`profile-avatar ${className}`.trim()}
        src={photo}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`profile-avatar placeholder ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initial || <User size={Math.max(14, Math.round(size * 0.45))} />}
    </span>
  );
};

export default ProfileAvatar;
