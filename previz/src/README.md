# Исходники превиза

`npm i three@0.160.0 playwright` затем `node render.js frames` (240 кадров, 24 fps) и
`ffmpeg -framerate 24 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p previz.mp4`.
Сцена целиком в `scene.js`, время в секундах задаётся `window.setT(t)`.
