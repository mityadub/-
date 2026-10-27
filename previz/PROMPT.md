# Финальная сцена — падение метеорита на остров (10 с)

Файлы:
- `previz_clean.mp4` — чистый 3D-превиз, 1280×720, 24 fps, 10 с (его подавать в модель как референс движения/композиции).
- `previz_annotated.mp4` — тот же превиз с таймкодами и подписями битов (для людей, в модель не подавать).

## Основной промпт (English)

```
Use the attached previz video as the exact guide for camera position, camera movement, composition, object placement and timing. Ignore its flat low-poly look: render everything as a photorealistic live-action shot from a big-budget disaster film, 16:9, 10 seconds, shot on large-format cinema camera, anamorphic lens, natural film grain, realistic atmospheric haze.

Setting: open sea under pale overcast daylight, a green jungle island on the horizon in the center of frame, a small dark ferry silhouette in the lower-left foreground (this is what the passengers see from the ship's window). Low camera just above the water.

0–3 s: Wide shot over the sea from the ship's side. Through a layer of heavy clouds in the upper right, a colossal meteor — roughly as big as the entire island — plunges down toward the island at tremendous speed. Its surface is a charred black rock with glowing molten orange cracks, the leading face white-hot; a huge tail of fire and dark smoke streams behind it and tears the clouds apart. The ferry stays a tiny silhouette in the foreground; the whole sea slowly turns orange from the approaching light.

3–6 s: The meteor smashes into the island. An instant blinding white-orange flash overexposes the frame for a few frames, with a brief camera shake. Then the flash falls off: glowing molten debris and rocks are thrown high above the jungle, trailing sparks, and a dense, boiling dark-brown and orange cloud with a fiery base starts to rise from the impact point.

6–10 s: The camera keeps slowly pulling back and rising slightly. A gigantic mushroom-shaped cloud of smoke, dust and fire rises over the island, lit from inside by orange fire. A fiery shockwave races outward across the water and the jungle toward the coastline, flattening and igniting trees, pushing a wall of spray and dust. The blast light reflects as a long glittering orange path on the sea surface toward the camera; the sky glows orange. The ferry remains a small dark silhouette. In the last second the image fades smoothly to black.

Real physical scale and weight, realistic motion of fire, smoke, dust and water, volumetric lighting, no stylization. Steady cinematic camera with slight natural shake on impact only.

Audio: a low rising rumble and rushing roar as the meteor falls; a massive deep impact hit at 3 s; a rolling, thundering explosion with crackling fire, debris whistling and water surging, decaying into low rumble; sound fades to silence with the picture at the end.
```

## Короткая версия (если модель плохо держит длинные промпты)

```
Follow the attached previz video for camera, composition and timing, but render photoreal, big-budget disaster movie, 10 s, 16:9. Over a calm sea under pale overcast daylight, a colossal burning meteor the size of the whole island falls through clouds with a long fire trail; a tiny ferry silhouette in the lower-left foreground. At 3 s it hits the island: blinding white flash, molten debris thrown up, a dense boiling cloud rises. Camera slowly pulls back: a gigantic mushroom cloud, a fiery shockwave spreading to the coast, orange blast light reflected in the sea, then fade to black. Realistic scale, fire, smoke, water. Audio: rising rumble, huge impact at 3 s, rolling explosion.
```

## Negative prompt (если поле есть)

```
cartoon, low-poly, flat shading, CGI look, game engine look, anime, text, subtitles, watermark, logo, extra ships, people in frame, camera cuts, jump cut, zoom in, meteor smaller than the island, distorted proportions, blur, morphing, flicker
```

## Что в превизе и зачем

| Время | Камера | Что происходит |
|---|---|---|
| 0–3 с | Широкий план у воды, лёгкое покачивание | Метеорит входит в кадр из облаков справа сверху и падает по диагонали к острову; огненный и дымный след; корабль внизу слева |
| 3.3 с | Короткая тряска | Контакт с островом, белая вспышка на ~0.5 с, затем спад |
| 3.3–6 с | Начало отъезда | Обломки по баллистике, огненное основание, растущее облако |
| 6–10 с | Плавный отъезд назад и чуть вверх | «Гриб» поднимается, огненная волна расходится кольцом к берегу, оранжевая дорожка на воде, с 8.6 с затемнение до чёрного |

## Заметки

- Масштаб: метеорит ≈ острову по размеру (в превизе оба ~280 условных единиц в диаметре).
- Корабль — маленький тёмный силуэт, он остаётся в кадре до конца и уменьшается из-за отъезда камеры.
- Если модель «пережимает» вспышку и теряет остров, уменьшите в промпте «overexposes the frame» до «a brief blinding flash».
- Если модель не принимает видео-референс, оставьте только текст промпта: тайминги и композиция в нём уже расписаны.
