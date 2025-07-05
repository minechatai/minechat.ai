import { Button } from "@/components/ui/button";
import telegramIcon from "@/assets/telegram.png";
import webIcon from "@/assets/web.png";
import discordIcon from "@/assets/discord.png";
import viberIcon from "@/assets/viber.png";
import whatsappIcon from "@/assets/whatsapp.png";
import slackIcon from "@/assets/slack.png";
import instagramIcon from "@/assets/instagram.png";
import facebookIcon from "@/assets/facebook.png";

export default function Landing() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo and Platform Icons */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center relative">
        {/* Platform Icons */}
        <div className="absolute inset-0">
          {/* Facebook Messenger - top left */}
          <div className="absolute top-48 left-32">
            <img src={facebookIcon} alt="Facebook Messenger" className="w-12 h-12" />
          </div>
          
          {/* Web - top center */}
          <div className="absolute top-40 right-32">
            <img src={webIcon} alt="Web" className="w-12 h-12" />
          </div>
          
          {/* Telegram - middle left */}
          <div className="absolute top-52 left-64">
            <img src={telegramIcon} alt="Telegram" className="w-12 h-12" />
          </div>
          
          {/* Instagram - middle left lower */}
          <div className="absolute top-64 left-24">
            <img src={instagramIcon} alt="Instagram" className="w-12 h-12" />
          </div>
          
          {/* Discord - middle right */}
          <div className="absolute top-72 right-24">
            <img src={discordIcon} alt="Discord" className="w-12 h-12" />
          </div>
          
          {/* WhatsApp - bottom left */}
          <div className="absolute bottom-48 left-52">
            <img src={whatsappIcon} alt="WhatsApp" className="w-12 h-12" />
          </div>
          
          {/* Slack - bottom center */}
          <div className="absolute bottom-40 left-32">
            <img src={slackIcon} alt="Slack" className="w-12 h-12" />
          </div>
          
          {/* Viber - bottom right */}
          <div className="absolute bottom-52 right-32">
            <img src={viberIcon} alt="Viber" className="w-12 h-12" />
          </div>
        </div>
        
        {/* Central Logo */}
        <div className="text-center z-10">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b1950" />
                    <stop offset="50%" stopColor="#b33054" />
                    <stop offset="100%" stopColor="#b73850" />
                  </linearGradient>
                </defs>
                <path 
                  d="M20 30 L50 15 L80 30 L80 45 L50 60 L20 45 Z M20 55 L50 40 L80 55 L80 70 L50 85 L20 70 Z" 
                  fill="url(#logoGradient)"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 logo-brand">
            minechat.ai
          </h1>
        </div>
      </div>

      {/* Right Side - Minechat Red Background with Content */}
      <div className="flex-1 bg-gradient-to-br from-[#8b1950] via-[#b33054] to-[#b73850] flex flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center">
          <h2 className="mb-6 leading-tight main-headline">
            Build, customize, and deploy your AI chat assistants today!
          </h2>
          
          <p className="text-lg mb-12 opacity-90 leading-relaxed">
            No coding needed. Launch your smart AI assistant in minutes.
          </p>
          
          <div className="flex flex-row space-x-4 mb-16">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-white hover:bg-gray-100 px-8 py-3 rounded-full login-button"
              size="lg"
            >
              Login
            </Button>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-white hover:bg-gray-100 px-8 py-3 rounded-full login-button"
              size="lg"
            >
              Sign up
            </Button>
          </div>
          
          <p className="text-sm opacity-75">
            Version 1.0.25
          </p>
        </div>
      </div>
    </div>
  );
}
