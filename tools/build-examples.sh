#!/usr/bin/env bash
# Downloads the example media (generated in Kolbo) and writes web-ready files to assets/examples.
# Full size: 1080px wide max. Small (-s): 560px graphics, 480px documents, 800px slides. Videos: 720px H.264, no audio.
set -euo pipefail
out=assets/examples; tmp=$(mktemp -d); mkdir -p "$out"
while read -r kind name url; do
  [ -z "$kind" ] && continue
  if [ "$kind" = img ]; then
    curl -fsSL --retry 3 "$url" -o "$tmp/$name.png"
    case "$name" in d-*) s=480;; s-*) s=800;; *) s=560;; esac
    cwebp -quiet -q 82 -resize 1080 0 "$tmp/$name.png" -o "$out/$name.webp"
    cwebp -quiet -q 78 -resize "$s" 0 "$tmp/$name.png" -o "$out/$name-s.webp"
  else
    curl -fsSL --retry 3 "$url" -o "$tmp/$name.mp4"
    ffmpeg -loglevel error -y -i "$tmp/$name.mp4" -an -vf "scale='min(720,iw)':-2" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$out/$name.mp4"
  fi
  echo "ok $name"
done < tools/examples-media.txt
ls -la "$out"
