import { getProvider } from "../utils/models";

const ProviderLogo = ({ provider, size = 18 }) => {
  const info = getProvider(provider);
  if (!info) return null;

  return (
    <img
      className="provider-logo"
      src={info.logo}
      alt=""
      width={size}
      height={size}
    />
  );
};

export default ProviderLogo;
