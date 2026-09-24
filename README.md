# תפזורת / Tifzoret

Client-only Hebrew word-search generator. React + Vite + TypeScript. No backend.

Live (GitHub Pages): https://kleinron.github.io/tifzoret/

---

## שימוש

1. פתחו את האפליקציה בדפדפן.
2. סמנו **כיוונים** — אפשר כל תת-קבוצה. ברירת המחדל: מימין לשמאל, מלמעלה למטה, ואלכסון מימין-מעלה לשמאל-מטה.
3. הדביקו מילים בתיבה (שורה או פסיק) ולחצו **הוסף למחסן מילים**. ניקוד ורווחים מוסרים אוטומטית. לכל היותר **50 מילים**, וכל מילה עד **16 אותיות**. מילה ארוכה מהלוח מציגה «המילה ארוכה מהלוח (N×N)» עם כפתור «הגדל לוח ל־X». הוסף/צור כבויים עד שהקלט תקין.
4. אפשרויות:
   - **מילוי אוטומטי לגיל ~10** — בלחיצת «צור» משלים מילים ידידותיות לילדים מקובץ מובנה (`src/data/kidWords.ts`), בלי רשת.
   - **ללא אותיות סופיות** — מילים עם ם / ן / ץ / ף / ך לא ייכנסו, והאותיות הסופיות לא יופיעו בריבוע.
5. בחרו גודל רשת (8–20), **תמונות על הלוח** וגודל גופן (ברירת מחדל 18pt).
   - ברירת המחדל היא **תמונה אחת**. 0 מכבה את התמונות.
   - כל תמונה תופסת ריבוע **4×4** בלי אותיות. משתי תמונות ומעלה אסור להן לחלוק צלע, גם חלקית — לאורך הצלע חייבת להישאר לפחות משבצת ריקה. מגע בפינה בלבד מותר. המקסימום הוא כמה ריבועים כאלה נכנסים (למשל 5 בלוח 12×12, 2 בלוח 8×8). הקטנת הלוח חותכת את המספר אוטומטית. אם מבקשים יותר תמונות ממה שנכנס, היצירה נכשלת בעברית.
   - הציורים (חתול, כדור, שמש, פרח, דג, כוכב, עץ, ציפור, בית, מכונית, תפוח, לב, ענן, ירח, פרפר, סירה) הם SVG מקוריים בתוך האפליקציה, בלי רשת.
   - **המיקום והציור מוגרלים מחדש** בכל «צור תפזורת» ובכל «ערבב מחדש», כמו שיבוץ המילים. מספר התמונות נשאר כפי שנבחר, כמו הכיוונים. «ערבב מחדש» לא מגריל מחדש את מילות גיל 10 שכבר נוספו.
6. **צור תפזורת** או **ערבב מחדש**. כל מילת מחסן מופיעה **פעם אחת בלבד** בכיוונים הפעילים; משבצות התמונה חסומות ולא נספרות כאות. אם נוצרת הופעה מקרית, המחולל מערבב שוב.
7. **הדפס** — ההגדרות מוסתרות, והדף מכיל את הריבוע (כולל התמונות) ואת מחסן המילים. סימוני פתרון לא מודפסים.
8. **שתף** — כפתור מתאר ליד ההדפסה. בחלון הקטן סמנו **כלול מחסן מילים** ו/או **כלול הגדרות** (ברירת מחדל: שניהם) ולחצו **העתק קישור**. מופיעה הודעה קצרה «הועתק».

## Usage

1. Open the app in a browser (`npm run dev` → http://localhost:5173/tifzoret/).
2. Tick any subset of **directions**. Defaults: right-to-left, top-to-bottom, and top-right→bottom-left.
3. Paste seed words (one per line or comma-separated) and click **Add to word store**. Hebrew nikud and spaces are stripped. Word store cap: **50 words**. Max word length: **16 letters**. A word longer than the current grid is blocked, with a CTA to grow the board.
4. Optional:
   - **Automatic age-~10 fill** — on Generate, extra kid-friendly words from the bundled corpus (offline).
   - **No final letters** — drop words containing ם ן ץ ף ך; those sofit letters also stay out of the grid.
5. Grid size 8–20. **Pictures on the board** default to **1** (0 turns them off). Font size defaults to **18pt** (Assistant / Heebo).
   - Each picture occupies a **4×4** block that letters cannot use. From two pictures up, blocks may not share an edge, even part of one: overlapping rows or columns keep at least one empty cell between them. Touching at a corner only is allowed. The maximum is how many such blocks fit (5 on 12×12, 2 on 8×8). Shrinking the grid clamps the count. Asking for more pictures than fit fails with a clear Hebrew message.
   - Drawings (cat, ball, sun, flower, fish, star, tree, bird, house, car, apple, heart, cloud, moon, butterfly, boat) are original SVGs embedded in the app (`src/images`), not loaded from the network.
   - **Position and which drawing are re-rolled** on Generate and on Reshuffle, same as word placement. The count is a setting, like directions, and is not re-rolled. Reshuffle does not draw a new age-10 word set.
6. **Generate** / **Reshuffle**. Each word in the store is placed **exactly once**. Image cells are blocked: they are not filled with letters, and a word span that enters one does not count. After random fill, the generator verifies there is no accidental second copy along enabled directions and retries until that holds (or fails clearly, in Hebrew, including when the pictures themselves cannot be placed).
7. **Print** hides settings; print shows the grid (including the pictures) and word store on one A4 page, without solve highlights.
8. **Share** (outline button next to Print) opens a popover: **Include word store** / **Include settings** (both on by default), then **Copy link**. A short «הועתק» toast confirms the clipboard write.

## Share links

Opening the app with **no `p` query param** uses built-in defaults.

Shared URLs look like `https://kleinron.github.io/tifzoret/?p=…`. The payload is a **compressed binary bitstream** encoded in **base62** (`0-9A-Za-z`):

- Base62 is URL-safe without `-`, `_`, or `=` so the param never needs percent-encoding and survives chat copy-paste better than base64url. It is ~1% less dense than base64url; Hebrew packing dominates the savings.
- Hebrew words use **5-bit indices** into a **27-letter** alphabet (22 regular letters + 5 sofit). Finals are kept distinct after nikud/space normalization, so `שלום` round-trips. The solved grid is **not** stored — the recipient regenerates from words and/or settings (directions, board size, font, age-10 fill, no-finals, **image count**). Image positions are not in the link; they are drawn again on generate. Version 1 links (from before pictures) open with **0** images. A fresh visit, with no `p`, still defaults to **1**.
- Checkboxes control which sections are packed: words only, settings only, or both.

## Develop

```bash
npm install
npm test
npm run dev
npm run build
```

GitHub Pages uses Vite `base: '/tifzoret/'` and `.github/workflows/deploy.yml`. In the repo settings, set Pages to **GitHub Actions**.

## License

Source in this repository; use freely.
