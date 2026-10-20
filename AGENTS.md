# Project rules
- Keep homepage 3D in a lazy-loaded, visibility-gated React Three Fiber section with a static logo fallback and reduced-motion support; core navigation must work without WebGL.
- Build the homepage emblem from the official logo’s bundled contours and texture; independent extrusion preserves the exact brand while bounded delta-clamped motion keeps it legible.
- Keep the member record as the source of appointment titles so member pages, cards and certificates share the same information.
- Open FFMUC conferences in a separate tab, not an iframe, because the service blocks embedding via frame-ancestors and SAMEORIGIN; invitation links retain the application room name.

- Keep homepage menu destinations in readable DOM links with a single lazy-loaded, visibility-gated React Three Fiber icon layer; automatic bounded sculpture motion makes depth visible on touch devices while static icons preserve no-WebGL and reduced-motion navigation.
