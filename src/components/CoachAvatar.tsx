export function CoachAvatar({ className = '' }: { className?: string }) {
    return (
        <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
            <style>{`
                @keyframes coachFloat {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-13px); }
                }
                @keyframes coachShadow {
                    0%, 100% { transform: scaleX(1);    opacity: 0.32; }
                    50%      { transform: scaleX(0.58); opacity: 0.07; }
                }
                @keyframes coachBlink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95%           { transform: scaleY(0.06); }
                }
                @keyframes chalkWave {
                    0%   { transform: rotate(0deg); }
                    20%  { transform: rotate(-14deg); }
                    45%  { transform: rotate(-4deg); }
                    70%  { transform: rotate(-11deg); }
                    100% { transform: rotate(0deg); }
                }
                .cv-float     { animation: coachFloat  3.8s ease-in-out infinite; }
                .cv-shadow    { animation: coachShadow 3.8s ease-in-out infinite; }
                .cv-eye-l, .cv-eye-r {
                    transform-box: fill-box;
                    transform-origin: center bottom;
                }
                .cv-eye-l { animation: coachBlink 5.4s ease-in-out infinite 0.1s; }
                .cv-eye-r { animation: coachBlink 5.4s ease-in-out infinite 0.24s; }
                .cv-chalk-arm {
                    transform-box: view-box;
                    transform-origin: 66px 162px;
                    animation: chalkWave 3.2s ease-in-out infinite 0.6s;
                }
            `}</style>

            <div className="cv-float">
                <svg viewBox="0 0 300 435" className="w-24 sm:w-44 md:w-56 lg:w-72 h-auto" xmlns="http://www.w3.org/2000/svg" aria-label="Coach Career Match">
                    <defs>
                        {/* Skin */}
                        <radialGradient id="gSkin" cx="38%" cy="30%" r="68%">
                            <stop offset="0%"   stopColor="#FFE2BF"/>
                            <stop offset="55%"  stopColor="#F2AA72"/>
                            <stop offset="100%" stopColor="#D87A3A"/>
                        </radialGradient>
                        <radialGradient id="gSkinH" cx="45%" cy="35%" r="65%">
                            <stop offset="0%"   stopColor="#FFECD4"/>
                            <stop offset="100%" stopColor="#E49658"/>
                        </radialGradient>
                        {/* Hair */}
                        <radialGradient id="gHair" cx="40%" cy="22%" r="70%">
                            <stop offset="0%"   stopColor="#7C4424"/>
                            <stop offset="55%"  stopColor="#4A2010"/>
                            <stop offset="100%" stopColor="#260C02"/>
                        </radialGradient>
                        {/* Shirt */}
                        <linearGradient id="gShirt" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stopColor="#C2CFDE"/>
                            <stop offset="48%"  stopColor="#E2ECF8"/>
                            <stop offset="100%" stopColor="#C2CFDE"/>
                        </linearGradient>
                        {/* Jeans */}
                        <linearGradient id="gJeans" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%"   stopColor="#4E88C8"/>
                            <stop offset="100%" stopColor="#2A5898"/>
                        </linearGradient>
                        {/* Rosy cheeks */}
                        <radialGradient id="gCheek" cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stopColor="#FF8888" stopOpacity="0.58"/>
                            <stop offset="100%" stopColor="#FF8888" stopOpacity="0"/>
                        </radialGradient>
                        {/* Argyle pattern - blue + light gray + white lines */}
                        <pattern id="argyle" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                            {/* Base: medium blue */}
                            <rect width="80" height="80" fill="#5588C8"/>
                            {/* Large dark diamond (center) */}
                            <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="#2D5898"/>
                            {/* Light gray corner diamonds */}
                            <path d="M0  0  L22 22 L0  44 L-22 22 Z" fill="#C0D4EC" opacity="0.72"/>
                            <path d="M80 0  L102 22 L80 44 L58 22 Z" fill="#C0D4EC" opacity="0.72"/>
                            <path d="M0  80 L22 58 L0  36 L-22 58 Z" fill="#C0D4EC" opacity="0.72"/>
                            <path d="M80 80 L102 58 L80 36 L58 58 Z" fill="#C0D4EC" opacity="0.72"/>
                            {/* White crossing diagonal lines */}
                            <line x1="0" y1="0"  x2="80" y2="80" stroke="white" strokeWidth="1.4" opacity="0.38"/>
                            <line x1="80" y1="0" x2="0"  y2="80" stroke="white" strokeWidth="1.4" opacity="0.38"/>
                        </pattern>
                        {/* Clip for vest shape */}
                        <clipPath id="vestClip">
                            <path d="M93 200 L107 191 L134 186 L150 184 L166 186 L193 191 L207 200 L212 332 L88 332 Z"/>
                        </clipPath>
                    </defs>

                    {/* ════════════════════════════
                        JEANS + SHOES
                    ════════════════════════════ */}
                    <path d="M96 327 Q95 368 93 396 Q91 404 103 407 Q118 410 124 404 L128 327 Z" fill="url(#gJeans)"/>
                    <path d="M204 327 Q205 368 207 396 Q209 404 197 407 Q182 410 176 404 L172 327 Z" fill="url(#gJeans)"/>
                    {/* Jeans center fold */}
                    <path d="M150 327 L150 348" stroke="#3A6898" strokeWidth="1.5" opacity="0.45"/>
                    {/* Shoes */}
                    <ellipse cx="110" cy="406" rx="23" ry="8"   fill="#121222"/>
                    <ellipse cx="190" cy="406" rx="23" ry="8"   fill="#121222"/>
                    <ellipse cx="114" cy="404" rx="12" ry="4.5" fill="#242438" opacity="0.5"/>
                    <ellipse cx="186" cy="404" rx="12" ry="4.5" fill="#242438" opacity="0.5"/>

                    {/* ════════════════════════════
                        BELT
                    ════════════════════════════ */}
                    <rect x="90"  y="320" width="120" height="10" rx="3"   fill="#161620"/>
                    <rect x="140" y="320" width="20"  height="10" rx="2.5" fill="#2A3850"/>
                    <rect x="144" y="322" width="12"  height="6"  rx="1.5" fill="#405080"/>

                    {/* ════════════════════════════
                        SHIRT BODY
                    ════════════════════════════ */}
                    <path d="M90 202 Q88 194 100 191 L134 186 L150 184 L166 186 L200 191 Q212 194 210 202 L214 334 L86 334 Z"
                          fill="url(#gShirt)"/>
                    {/* Shirt collar */}
                    <path d="M136 188 L130 215 L150 222 L170 215 L164 188 L150 196 Z" fill="#EDF3FB"/>
                    <path d="M136 188 L126 218" stroke="#CBD4E2" strokeWidth="1.2" fill="none"/>
                    <path d="M164 188 L174 218" stroke="#CBD4E2" strokeWidth="1.2" fill="none"/>

                    {/* ════════════════════════════
                        VEST (argyle)
                    ════════════════════════════ */}
                    {/* Fill with argyle pattern clipped to vest shape */}
                    <path d="M93 200 L107 191 L134 186 L150 184 L166 186 L193 191 L207 200 L212 332 L88 332 Z"
                          fill="url(#argyle)"/>
                    {/* Vest border */}
                    <path d="M93 200 L107 191 L134 186 L150 184 L166 186 L193 191 L207 200 L212 332 L88 332 Z"
                          fill="none" stroke="#1C3A68" strokeWidth="2"/>
                    {/* V-neck opening - shirt visible */}
                    <path d="M134 186 L150 222 L166 186" fill="#EDF3FB" stroke="#C8D4E2" strokeWidth="1.2"/>
                    <path d="M134 186 L122 218" stroke="#B8C8D8" strokeWidth="0.8" fill="none"/>
                    <path d="M166 186 L178 218" stroke="#B8C8D8" strokeWidth="0.8" fill="none"/>
                    {/* Vest highlight (top shine) */}
                    <path d="M107 191 Q150 183 193 191" stroke="white" strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round"/>

                    {/* ════════════════════════════
                        SLEEVES
                    ════════════════════════════ */}
                    {/* Right sleeve - static, hand on hip */}
                    <path d="M207 200 Q230 212 242 230 Q252 248 248 268"
                          stroke="#C2CFDE" strokeWidth="28" fill="none" strokeLinecap="round"/>
                    {/* Right hand on hip */}
                    <ellipse cx="245" cy="272" rx="19" ry="14" fill="url(#gSkinH)" transform="rotate(16 245 272)"/>
                    <path d="M234 265 Q245 258 256 265" stroke="#C07840" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4"/>
                    <path d="M233 272 Q245 265 257 272" stroke="#C07840" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4"/>
                    <path d="M235 278 Q245 274 255 278" stroke="#C07840" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4"/>

                    {/* Left upper arm - static */}
                    <path d="M93 200 Q76 208 66 186 Q60 170 66 155"
                          stroke="#C2CFDE" strokeWidth="28" fill="none" strokeLinecap="round"/>

                    {/* ════════════════════════════
                        LEFT FOREARM + HAND + CHALK (animated)
                    ════════════════════════════ */}
                    <g className="cv-chalk-arm">
                        {/* Forearm */}
                        <path d="M66 155 Q60 138 64 118 Q66 108 72 100"
                              stroke="#C2CFDE" strokeWidth="25" fill="none" strokeLinecap="round"/>
                        {/* Hand */}
                        <ellipse cx="76" cy="92" rx="17" ry="13" fill="url(#gSkinH)" transform="rotate(-28 76 92)"/>
                        {/* Finger detail lines */}
                        <path d="M64 87 Q75 80 86 87" stroke="#C07840" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.4"/>
                        <path d="M63 94 Q75 87 85 94" stroke="#C07840" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.4"/>
                        <path d="M65 100 Q75 96 84 100" stroke="#C07840" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>
                        {/* Thumb */}
                        <path d="M85 87 Q96 78 94 66"
                              stroke="url(#gSkinH)" strokeWidth="10" fill="none" strokeLinecap="round"/>
                        <path d="M85 87 Q96 78 94 66"
                              stroke="#C07840" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.28"/>
                        {/* ── Chalk ── */}
                        <g transform="rotate(-20 72 72)">
                            {/* Body */}
                            <rect x="67" y="42" width="11" height="34" rx="3"   fill="#F6F3EC"/>
                            {/* Top cap */}
                            <rect x="67" y="42" width="11" height="7"  rx="2.5" fill="#DDD8CA"/>
                            {/* Chalk lines texture */}
                            <path d="M69 50 L69 74" stroke="#DDD4BC" strokeWidth="1"   opacity="0.5"/>
                            <path d="M73 50 L73 74" stroke="#E4DCC8" strokeWidth="0.8" opacity="0.4"/>
                            <path d="M76 52 L76 74" stroke="#DDD4BC" strokeWidth="0.8" opacity="0.35"/>
                            {/* Tip */}
                            <path d="M67 74 L72.5 82 L78 74 Z" fill="#E4DCC0"/>
                            {/* White chalk dust at tip */}
                            <ellipse cx="72.5" cy="83" rx="4" ry="2" fill="white" opacity="0.7"/>
                            <ellipse cx="76"   cy="80" rx="2" ry="1" fill="white" opacity="0.4"/>
                        </g>
                    </g>

                    {/* ════════════════════════════
                        NECK
                    ════════════════════════════ */}
                    <path d="M132 178 Q150 171 168 178 L171 192 Q150 200 129 192 Z" fill="url(#gSkin)"/>

                    {/* ════════════════════════════
                        HEAD - large Pixar oval
                    ════════════════════════════ */}
                    <ellipse cx="150" cy="107" rx="78" ry="74" fill="url(#gSkin)"/>
                    {/* Side shading */}
                    <ellipse cx="90"  cy="118" rx="13" ry="17" fill="#C07038" opacity="0.08"/>
                    <ellipse cx="210" cy="118" rx="13" ry="17" fill="#C07038" opacity="0.08"/>

                    {/* ════════════════════════════
                        HAIR - styled, swept side
                    ════════════════════════════ */}
                    {/* Main volume block */}
                    <ellipse cx="150" cy="64" rx="78" ry="40" fill="url(#gHair)"/>
                    <rect x="72" y="64" width="156" height="44" fill="#3C1A08"/>
                    {/* Sideburns */}
                    <path d="M72 72 Q63 100 65 140 Q67 150 74 148 Q70 120 78 86 Z" fill="#3C1A08"/>
                    <path d="M228 72 Q237 100 235 140 Q233 150 226 148 Q230 120 222 86 Z" fill="#3C1A08"/>
                    {/* Top swept crest */}
                    <path d="M72 50 Q98 38 150 36 Q202 38 228 50 Q216 33 184 28 Q154 24 118 30 Q94 34 78 46 Z" fill="#5C2E12"/>
                    {/* Front hairline wave */}
                    <path d="M76 54 Q106 46 134 50 Q148 52 158 48 Q176 44 198 50 Q214 56 228 54"
                          fill="none" stroke="#4A2208" strokeWidth="6" strokeLinecap="round" opacity="0.55"/>
                    {/* Hair sheen */}
                    <path d="M110 34 Q148 26 186 34" stroke="#8A5030" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.38"/>
                    <path d="M120 32 Q150 26 180 32" stroke="#9A6040" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.22"/>

                    {/* ════════════════════════════
                        EARS
                    ════════════════════════════ */}
                    <ellipse cx="72"  cy="110" rx="11.5" ry="16" fill="url(#gSkin)"/>
                    <ellipse cx="228" cy="110" rx="11.5" ry="16" fill="url(#gSkin)"/>
                    <ellipse cx="72"  cy="110" rx="6"    ry="9"  fill="#C07040" opacity="0.28"/>
                    <ellipse cx="228" cy="110" rx="6"    ry="9"  fill="#C07040" opacity="0.28"/>
                    <path d="M66 102 Q70 110 66 118" stroke="#C07040" strokeWidth="1.5" fill="none" opacity="0.35"/>
                    <path d="M234 102 Q230 110 234 118" stroke="#C07040" strokeWidth="1.5" fill="none" opacity="0.35"/>

                    {/* ════════════════════════════
                        EYEBROWS - confident arch
                    ════════════════════════════ */}
                    <path d="M94 88 Q115 79 136 84"  stroke="#240C02" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
                    <path d="M164 84 Q185 79 206 88" stroke="#240C02" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
                    <path d="M95 87 Q115 78 135 83"  stroke="#7A4020" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.28"/>
                    <path d="M165 83 Q185 78 205 87" stroke="#7A4020" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.28"/>

                    {/* ════════════════════════════
                        EYES - Pixar large, detailed
                    ════════════════════════════ */}
                    <g className="cv-eye-l">
                        <ellipse cx="118" cy="106" rx="22" ry="20" fill="white"/>
                        <circle  cx="119" cy="107" r="14"  fill="#3E1E08"/>
                        <circle  cx="119" cy="107" r="13"  fill="#6E3A18"/>
                        <circle  cx="119" cy="108" r="8"   fill="#100804"/>
                        {/* Main catchlight */}
                        <circle  cx="124" cy="102" r="4.5" fill="white" opacity="0.94"/>
                        {/* Secondary catchlight */}
                        <circle  cx="115" cy="113" r="2"   fill="white" opacity="0.4"/>
                        {/* Upper lash line */}
                        <path d="M96 99 Q118 90 140 99" stroke="#160802" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        {/* Lower lid */}
                        <path d="M98 114 Q118 122 138 114" stroke="#9A5028" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.3"/>
                    </g>
                    <g className="cv-eye-r">
                        <ellipse cx="182" cy="106" rx="22" ry="20" fill="white"/>
                        <circle  cx="181" cy="107" r="14"  fill="#3E1E08"/>
                        <circle  cx="181" cy="107" r="13"  fill="#6E3A18"/>
                        <circle  cx="181" cy="108" r="8"   fill="#100804"/>
                        <circle  cx="186" cy="102" r="4.5" fill="white" opacity="0.94"/>
                        <circle  cx="177" cy="113" r="2"   fill="white" opacity="0.4"/>
                        <path d="M160 99 Q182 90 204 99" stroke="#160802" strokeWidth="3" fill="none" strokeLinecap="round"/>
                        <path d="M162 114 Q182 122 202 114" stroke="#9A5028" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.3"/>
                    </g>

                    {/* ════════════════════════════
                        GLASSES - round, dark frames
                    ════════════════════════════ */}
                    <circle cx="118" cy="106" r="25" fill="none" stroke="#141414" strokeWidth="3.8"/>
                    <circle cx="182" cy="106" r="25" fill="none" stroke="#141414" strokeWidth="3.8"/>
                    {/* Bridge */}
                    <path d="M143 107 Q150 102 157 107" stroke="#141414" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                    {/* Temples to ears */}
                    <path d="M93  91 Q80 85 72  88"  stroke="#141414" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                    <path d="M207 91 Q220 85 228 88" stroke="#141414" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                    {/* Lens sheen */}
                    <path d="M100 93 Q110 86 120 92" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.44"/>
                    <path d="M164 93 Q174 86 184 92" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.44"/>

                    {/* ════════════════════════════
                        NOSE - round, Pixar ball
                    ════════════════════════════ */}
                    <circle cx="150" cy="133" r="12"  fill="#E89060" opacity="0.62"/>
                    <circle cx="150" cy="134" r="10.5" fill="#E89060"/>
                    <circle cx="147" cy="130" r="4"   fill="white"   opacity="0.26"/>
                    <ellipse cx="143" cy="139" rx="4.5" ry="3" fill="#B06030" opacity="0.28"/>
                    <ellipse cx="157" cy="139" rx="4.5" ry="3" fill="#B06030" opacity="0.28"/>

                    {/* ════════════════════════════
                        MOUTH - wide open happy smile
                    ════════════════════════════ */}
                    {/* Mouth opening */}
                    <path d="M114 153 Q132 180 150 182 Q168 180 186 153 Q172 170 150 172 Q128 170 114 153 Z"
                          fill="#6A1808"/>
                    {/* Teeth */}
                    <path d="M116 155 Q133 174 150 176 Q167 174 184 155 Q170 168 150 170 Q130 168 116 155 Z"
                          fill="white"/>
                    {/* Teeth dividers */}
                    <line x1="133" y1="155" x2="133" y2="168" stroke="#DCDCD0" strokeWidth="1.2" opacity="0.65"/>
                    <line x1="150" y1="156" x2="150" y2="170" stroke="#DCDCD0" strokeWidth="1.2" opacity="0.65"/>
                    <line x1="167" y1="155" x2="167" y2="168" stroke="#DCDCD0" strokeWidth="1.2" opacity="0.65"/>
                    {/* Upper lip */}
                    <path d="M114 153 Q132 147 150 148 Q168 147 186 153" fill="#B05838" opacity="0.38" stroke="#A04828" strokeWidth="1.2"/>
                    {/* Lower lip */}
                    <path d="M114 153 Q150 163 186 153" stroke="#904020" strokeWidth="1.5" fill="none" opacity="0.38"/>
                    {/* Dimples */}
                    <circle cx="111" cy="152" r="4.5" fill="#E08060" opacity="0.32"/>
                    <circle cx="189" cy="152" r="4.5" fill="#E08060" opacity="0.32"/>

                    {/* ════════════════════════════
                        ROSY CHEEKS
                    ════════════════════════════ */}
                    <ellipse cx="90"  cy="136" rx="25" ry="19" fill="url(#gCheek)"/>
                    <ellipse cx="210" cy="136" rx="25" ry="19" fill="url(#gCheek)"/>

                </svg>
            </div>

            {/* Ground shadow */}
            <div
                className="cv-shadow w-28 h-3 rounded-full -mt-4"
                style={{ background: 'radial-gradient(ellipse, rgba(25,55,115,0.38) 0%, transparent 70%)' }}
            />
        </div>
    );
}
