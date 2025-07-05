import { useState } from "react";
import { Button } from "@/components/ui/button";
import EmailLoginModal from "@/components/email-login-modal";
import { Loader2 } from "lucide-react";
import telegramIcon from "@/assets/telegram.png";
import webIcon from "@/assets/web.png";
import discordIcon from "@/assets/discord.png";
import viberIcon from "@/assets/viber.png";
import whatsappIcon from "@/assets/whatsapp.png";
import slackIcon from "@/assets/slack.png";
import instagramIcon from "@/assets/instagram.png";
import facebookIcon from "@/assets/facebook.png";
import minechatLogo from "@/assets/minechat-logo.png";

export default function Login() {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setLoadingProvider('google');
    window.location.href = '/api/auth/google';
  };

  const handleAppleLogin = () => {
    setLoadingProvider('apple');
    window.location.href = '/api/login';
  };

  return (
    <div className="flex h-screen">
      {/* Left side - White background with scattered platform icons */}
      <div className="w-1/2 bg-white relative overflow-hidden flex items-center justify-center">
        {/* Platform icons scattered around the logo */}
        <div className="absolute inset-0">
          {/* Facebook Messenger - top left */}
          <div className="absolute top-[15%] left-[15%]">
            <img src={facebookIcon} alt="Facebook" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Web/Globe - top center */}
          <div className="absolute top-[20%] left-[60%]">
            <img src={webIcon} alt="Web" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Telegram - top right */}
          <div className="absolute top-[25%] right-[20%]">
            <img src={telegramIcon} alt="Telegram" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Instagram - left middle */}
          <div className="absolute top-[45%] left-[8%]">
            <img src={instagramIcon} alt="Instagram" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Discord - right middle */}
          <div className="absolute top-[40%] right-[8%]">
            <img src={discordIcon} alt="Discord" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* WhatsApp - bottom left */}
          <div className="absolute bottom-[30%] left-[20%]">
            <img src={whatsappIcon} alt="WhatsApp" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Slack - bottom center */}
          <div className="absolute bottom-[20%] left-[45%]">
            <img src={slackIcon} alt="Slack" className="w-12 h-12 opacity-80" />
          </div>
          
          {/* Viber - bottom right */}
          <div className="absolute bottom-[25%] right-[15%]">
            <img src={viberIcon} alt="Viber" className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        {/* Central minechat.ai logo */}
        <div className="text-center z-10 relative">
          <img 
            src={minechatLogo} 
            alt="minechat.ai" 
            className="mx-auto"
            style={{
              width: '271.4975891113281px',
              height: '155.1802215576172px',
              opacity: 1
            }}
          />
        </div>
      </div>

      {/* Right side - Minechat red gradient with login options */}
      <div className="w-1/2 minechat-gradient flex flex-col items-center justify-center text-white px-16">
        <div className="w-full max-w-sm space-y-4">
          {/* Continue with Apple */}
          <Button
            onClick={handleAppleLogin}
            disabled={loadingProvider !== null}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 px-8 rounded-full flex items-center justify-center space-x-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 510 }}
          >
            {loadingProvider === 'apple' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
            <span>{loadingProvider === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple'}</span>
          </Button>

          {/* Continue with Google */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 px-8 rounded-full flex items-center justify-center space-x-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 510 }}
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </Button>

          {/* Continue with Email */}
          <Button
            onClick={() => setIsEmailModalOpen(true)}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 px-8 rounded-full flex items-center justify-center space-x-3 text-base"
            style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 510 }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Continue with Email</span>
          </Button>

          {/* Terms and Privacy */}
          <div className="text-center mt-8 text-sm text-white/75">
            <p>By continuing, you agree to our</p>
            <p className="mt-1">
              <a href="#" className="underline text-white/90 hover:text-white">Terms & Conditions</a> and <a href="#" className="underline text-white/90 hover:text-white">Privacy Policy</a>
            </p>
          </div>

          {/* Development-only test buttons */}
          <div className="text-center mt-8 space-y-2">
            <Button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {
                  // Ignore errors, just proceed
                }
                window.location.href = '/api/login';
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm px-6 py-3 rounded-md font-medium border border-white/20"
            >
              Restore Minechat AI Session
            </Button>
            <br />
            <Button
              onClick={() => {
                fetch('/api/auth/email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: 'test@minechat.ai',
                    password: 'testpassword123',
                  }),
                }).then(() => {
                  window.location.href = '/dashboard';
                });
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-md border border-white/20"
            >
              Continue as Test User
            </Button>
          </div>
        </div>
      </div>

      {/* Email Login Modal */}
      <EmailLoginModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
      />
    </div>
  );
}