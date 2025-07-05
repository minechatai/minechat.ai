import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo and Platform Icons */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center relative">
        {/* Platform Icons */}
        <div className="absolute inset-0">
          {/* Messenger - top left */}
          <div className="absolute top-48 left-32">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.665 1.438 5.177L2 22l4.823-1.438C8.335 21.475 10.11 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.691 0-3.296-.471-4.673-1.295L6 19.5l.795-1.327C5.971 16.796 5.5 15.191 5.5 13.5 5.5 8.806 8.806 5.5 12 5.5s6.5 3.306 6.5 6.5-3.306 6.5-6.5 6.5z"/>
              </svg>
            </div>
          </div>
          
          {/* Globe/Web - top center */}
          <div className="absolute top-40 right-32">
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
          
          {/* Telegram - middle left */}
          <div className="absolute top-52 left-64">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.37 6.89c-.1.53-.4.66-.8.41l-2.27-1.68-1.1 1.05c-.12.12-.22.22-.45.22l.16-2.33 4.18-3.78c.18-.16-.04-.25-.28-.09l-5.17 3.25-2.23-.7c-.49-.15-.5-.49.1-.73l8.7-3.35c.41-.15.77.1.63.71z"/>
              </svg>
            </div>
          </div>
          
          {/* Instagram - middle left lower */}
          <div className="absolute top-64 left-24">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </div>
          
          {/* Discord - middle right */}
          <div className="absolute top-72 right-24">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
          </div>
          
          {/* WhatsApp - bottom left */}
          <div className="absolute bottom-48 left-52">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
              </svg>
            </div>
          </div>
          
          {/* Slack - bottom center */}
          <div className="absolute bottom-40 left-32">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
          </div>
          
          {/* Viber - bottom right */}
          <div className="absolute bottom-52 right-32">
            <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.04 0C6.56 0 1.3 5.26 1.3 11.74c0 2.3.67 4.45 1.84 6.26L.85 23.15l5.32-2.23c1.745 1.008 3.75 1.54 5.87 1.54C19.44 22.42 24.7 17.16 24.7 10.68c0-6.48-5.26-11.74-11.74-11.74L13.04 0zm.06 2.16c5.58 0 10.12 4.54 10.12 10.12s-4.54 10.12-10.12 10.12c-1.98 0-3.82-.57-5.37-1.56l-.37-.24-3.73 1.56 1.58-3.66-.26-.4A10.056 10.056 0 013.28 12.8c0-5.58 4.54-10.12 10.12-10.12L13.1 2.16z"/>
              </svg>
            </div>
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
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Build, customize, and deploy your AI chat assistants today!
          </h2>
          
          <p className="text-lg mb-12 opacity-90 leading-relaxed">
            No coding needed. Launch your smart AI assistant in minutes.
          </p>
          
          <div className="flex flex-col space-y-4 mb-16">
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
