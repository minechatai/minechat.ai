import { Button } from "@/components/ui/button";
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
  return (
    <div className="flex h-screen">
      {/* Left side - identical to Login Flow 1 */}
      <div className="w-1/2 bg-white relative overflow-hidden flex items-center justify-center">
        {/* Platform icons scattered on left side */}
        <div className="absolute inset-0">
          <div className="absolute top-32 left-24">
            <img src={facebookIcon} alt="Facebook" className="w-12 h-12" />
          </div>
          <div className="absolute top-48 right-32">
            <img src={webIcon} alt="Web" className="w-12 h-12" />
          </div>
          <div className="absolute top-64 right-24">
            <img src={telegramIcon} alt="Telegram" className="w-12 h-12" />
          </div>
          <div className="absolute bottom-64 left-16">
            <img src={instagramIcon} alt="Instagram" className="w-12 h-12" />
          </div>
          <div className="absolute bottom-48 right-16">
            <img src={discordIcon} alt="Discord" className="w-12 h-12" />
          </div>
          <div className="absolute bottom-32 left-32">
            <img src={whatsappIcon} alt="WhatsApp" className="w-12 h-12" />
          </div>
          <div className="absolute bottom-16 right-32">
            <img src={slackIcon} alt="Slack" className="w-12 h-12" />
          </div>
          <div className="absolute bottom-24 right-48">
            <img src={viberIcon} alt="Viber" className="w-12 h-12" />
          </div>
        </div>
        
        {/* Central Logo */}
        <div className="text-center z-10 relative">
          <img src={minechatLogo} alt="minechat.ai" className="mx-auto" />
        </div>
      </div>

      {/* Right side - Minechat red gradient with login options */}
      <div className="w-1/2 minechat-gradient flex flex-col items-center justify-center text-white px-16">
        <div className="w-full max-w-md space-y-4">
          {/* Continue with Apple */}
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-6 px-8 rounded-full flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.74.1.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.744 2.840c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
            </svg>
            <span>Continue with Apple</span>
          </Button>

          {/* Continue with Google */}
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-6 px-8 rounded-full flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </Button>

          {/* Continue with Email */}
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-6 px-8 rounded-full flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Continue with Email</span>
          </Button>

          {/* Terms and Privacy */}
          <div className="text-center mt-8 text-sm opacity-75">
            <p>By continuing, you agree to our</p>
            <p>
              <a href="#" className="underline">Terms & Conditions</a> and <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}