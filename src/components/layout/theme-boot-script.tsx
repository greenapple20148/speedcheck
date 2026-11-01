"use client";

const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('cm-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

/** Server HTML runs this before paint. Client renders a non-executable type so React does not reject the tag. */
export function ThemeBootScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
    />
  );
}
