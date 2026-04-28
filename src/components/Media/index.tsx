import React from 'react';

/**
 * Drop-in replacement for <img> that renders a silent looping <video> when the
 * src is an mp4/webm/mov. Lets us swap out heavy GIFs for hardware-decoded video
 * without touching layout or styling at the call site.
 *
 * Why: animated GIFs are CPU-decoded and 5-15× larger than equivalent H.264.
 * <video autoplay loop muted playsinline> is hardware-decoded and visually
 * identical for our purposes.
 */
type MediaProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Any extra props to spread only when rendering as <video>. */
  videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>;
};

const VIDEO_RE = /\.(mp4|webm|mov)(\?|$)/i;

export default function Media({ src, alt, videoProps, loading, decoding, fetchPriority, ...rest }: MediaProps) {
  void loading; void decoding; void fetchPriority; // image-only, ignored on <video>
  if (typeof src === 'string' && VIDEO_RE.test(src)) {
    const { onLoad: _ignored, ...common } = rest as React.HTMLAttributes<HTMLElement> & { onLoad?: unknown };
    void _ignored;
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label={alt}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        {...(common as React.VideoHTMLAttributes<HTMLVideoElement>)}
        {...videoProps}
      />
    );
  }
  return <img src={src} alt={alt} loading={loading ?? 'lazy'} decoding={decoding ?? 'async'} {...rest} />;
}
