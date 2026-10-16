# Project rules
- Keep homepage 3D in a lazy-loaded, visibility-gated React Three Fiber section with a static logo fallback and reduced-motion support; core navigation must work without WebGL.
- Load the homepage mascot from a bundled CC0 GLB and drive its clips with a delta-clamped AnimationMixer so greetings and pause remain independent of AI and external services.
- Keep the member record as the source of appointment titles so member pages, cards and certificates share the same information.