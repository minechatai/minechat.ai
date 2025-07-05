import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - White Background with Platform Icons */}
      <div className="flex-1 bg-white flex items-center justify-center relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        <div className="relative w-full h-full flex items-center justify-center max-w-md lg:max-w-lg">
          
          {/* Messenger - Top Left */}
          <div className="absolute" style={{ top: '20%', left: '15%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.145 2 11.333c0 2.91 1.309 5.506 3.375 7.25v3.417l3.222-1.778c.86.238 1.778.375 2.736.375 5.523 0 10-4.145 10-9.334C21.333 6.145 17.523 2 12 2zm1.04 12.583l-2.604-2.781-5.083 2.781 5.604-5.958 2.667 2.781 5.02-2.781-5.604 5.958z"/>
              </svg>
            </div>
          </div>

          {/* Globe/Website - Top Center */}
          <div className="absolute" style={{ top: '15%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Telegram - Top Right */}
          <div className="absolute" style={{ top: '25%', right: '20%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.9 6.858l-1.55 7.318c-.116.527-.423.657-.857.41l-2.367-1.745-1.143 1.1c-.126.126-.233.233-.478.233l.17-2.41 4.4-3.976c.192-.17-.042-.264-.295-.095L9.537 14.32l-2.35-.734c-.51-.16-.52-.51.107-.755l9.175-3.535c.425-.16.798.095.66.755z"/>
              </svg>
            </div>
          </div>

          {/* Instagram - Middle Left */}
          <div className="absolute" style={{ top: '45%', left: '8%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.162c3.204 0 3.584.012 4.849.07 1.366.062 2.633.334 3.608 1.31.975.975 1.248 2.242 1.31 3.608.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.849c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.248-3.608 1.31-1.265.058-1.645.07-4.849.07s-3.584-.012-4.849-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.248-2.242-1.31-3.608-.058-1.265-.07-1.645-.07-4.849s.012-3.584.07-4.849c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.248 3.608-1.31 1.265-.058 1.645-.07 4.849-.07M12 0C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038C23.986 15.668 24 15.259 24 12c0-3.259-.014-3.668-.072-4.948-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
          </div>

          {/* Central Logo - Minechat.ai */}
          <div className="flex items-center justify-center z-10">
            <div className="text-center">
              {/* Logo - Using actual minechat logo */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-lg flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="Minechat AI" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              {/* Logo Text */}
              <h2 className="text-3xl font-bold text-[#8b1950] font-poppins logo-brand">
                minechat.ai
              </h2>
            </div>
          </div>

          {/* Discord - Middle Right */}
          <div className="absolute" style={{ top: '45%', right: '8%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.197.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
          </div>

          {/* WhatsApp - Bottom Left */}
          <div className="absolute" style={{ bottom: '25%', left: '20%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/>
              </svg>
            </div>
          </div>

          {/* Slack - Bottom Left */}
          <div className="absolute" style={{ bottom: '15%', left: '15%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
              </svg>
            </div>
          </div>

          {/* Viber - Bottom Right */}
          <div className="absolute" style={{ bottom: '15%', right: '15%' }}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.03 1.928C19.707 2.148 24 6.888 24 14.153c0 1.818-.324 3.491-.972 4.972-1.512 3.456-4.68 5.856-8.748 5.856-1.368 0-2.7-.252-3.96-.756L0 24l.468-9.324c-.468-1.224-.72-2.556-.72-3.924C-.252 4.788 5.832-.288 13.032 1.928zm.936 3.168c-1.008-.108-1.944-.036-2.88.252-1.404.432-2.592 1.224-3.528 2.268-.936 1.08-1.512 2.412-1.692 3.852-.144 1.188-.036 2.376.324 3.492.36 1.152.936 2.196 1.728 3.06.792.9 1.764 1.584 2.844 2.016 1.044.432 2.196.612 3.348.54 1.188-.072 2.34-.396 3.384-.936 1.044-.54 1.944-1.296 2.664-2.232.72-.936 1.224-2.016 1.476-3.168.252-1.188.252-2.412 0-3.6-.252-1.188-.756-2.304-1.476-3.24-.72-.936-1.62-1.692-2.664-2.232-1.044-.54-2.196-.864-3.384-.936-.396-.036-.792-.036-1.152-.036zm3.168 5.472c.36.216.648.54.828.936.216.396.324.828.324 1.296 0 .432-.108.828-.288 1.188-.216.36-.504.648-.864.828-.36.216-.756.324-1.188.324-.432 0-.828-.108-1.188-.324-.36-.18-.648-.468-.828-.828-.216-.36-.324-.756-.324-1.188 0-.468.108-.9.324-1.296.18-.396.468-.72.828-.936.36-.216.756-.324 1.188-.324.432 0 .828.108 1.188.324z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Minechat Red Gradient */}
      <div className="flex-1 bg-gradient-to-br from-[#8b1950] via-[#b33054] to-[#b73850] flex flex-col items-center justify-center text-white px-6 py-8 lg:px-8 min-h-[50vh] lg:min-h-screen">
        <div className="text-center max-w-lg w-full">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 leading-tight px-4 lg:px-0">
            Build, customize, and deploy your AI chat assistants today!
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl mb-8 opacity-90 font-light px-4 lg:px-0">
            No coding needed. Launch your smart AI assistant in minutes.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 px-4 lg:px-0">
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-white text-black hover:bg-gray-100 transition-colors font-medium text-base sm:text-lg px-6 sm:px-8 py-3 rounded-full min-w-[140px] sm:min-w-[160px]"
            >
              Login
            </Button>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-white text-black hover:bg-gray-100 transition-colors font-medium text-base sm:text-lg px-6 sm:px-8 py-3 rounded-full min-w-[140px] sm:min-w-[160px]"
            >
              Sign up
            </Button>
          </div>

          {/* Version */}
          <p className="text-sm opacity-70">
            Version 1.0.25
          </p>
        </div>
      </div>
    </div>
  );
}
