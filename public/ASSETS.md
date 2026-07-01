# Hero avatar assets (optional — the hero looks premium without them)

The AvatarHero (components/AvatarHero.tsx) shows a deep-navy cinematic hero with
a soft gold glow out of the box. To add the AI video-avatar (markevita / TA Next
style), drop transparent videos here — no code changes needed:

- /public/videos/pnc-avatar-en.webm   (VP9 + alpha, transparent receptionist)
- /public/videos/pnc-avatar-ru.webm
- /public/videos/pnc-avatar-es.webm
- (optional .mp4 fallbacks with the same names, e.g. HEVC-alpha)
- /public/images/pnc-hero-poster.jpg  (optional still shown before the video plays)

The EN / RU / ES switcher swaps the avatar language automatically. If a video is
missing, the hero falls back to the navy gradient — nothing breaks.
