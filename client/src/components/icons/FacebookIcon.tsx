interface FacebookIconProps {
  className?: string;
}

export const FacebookIcon = ({ className = "w-4 h-4" }: FacebookIconProps) => {
  return (
    <div className={`${className} bg-blue-600 rounded-full flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">f</span>
    </div>
  );
};