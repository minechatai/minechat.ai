import messengerLogo from "@assets/facebook-messenger-logo.webp";

interface FacebookIconProps {
  className?: string;
}

export const FacebookIcon = ({ className = "w-4 h-4" }: FacebookIconProps) => {
  return (
    <img 
      src={messengerLogo} 
      alt="Facebook Messenger" 
      className={className}
    />
  );
};