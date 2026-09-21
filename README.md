# תפזורת / Tifzoret

Client-only Hebrew word-search generator. React + Vite + TypeScript. No backend.

Live (GitHub Pages): https://kleinron.github.io/tifzoret/

---

## שימוש

1. פתחו את האפליקציה בדפדפן.
2. סמנו **כיוונים** — אפשר כל תת-קבוצה. ברירת המחדל: מימין לשמאל, מלמעלה למטה, ואלכסון מימין-מעלה לשמאל-מטה.
3. הדביקו מילים בתיבה (שורה או פסיק) ולחצו **הוסף לרשימה**. ניקוד ורווחים מוסרים אוטומטית. לכל היותר **50 מילים**, וכל מילה עד **16 אותיות**. מילה ארוכה מהלוח מציגה «המילה ארוכה מהלוח (N×N)» עם כפתור «הגדל לוח ל־X». הוסף/צור כבויים עד שהקלט תקין.
4. אפשרויות:
   - **השלם אקראי לגיל 10** — מוסיף מילים ידידותיות לילדים מקובץ מובנה (`src/data/kidWords.ts`), בלי רשת.
   - **ללא אותיות סופיות** — מילים עם ם / ן / ץ / ף / ך לא ייכנסו, והאותיות הסופיות לא יופיעו בריבוע.
5. בחרו גודל רשת (8–20) וגודל גופן (ברירת מחדל 18pt).
6. **צור תפזורת** או **ערבב מחדש**. כל מילת בנק מופיעה **פעם אחת בלבד** בכיוונים הפעילים; אם נוצרת הופעה מקרית, המחולל מערבב שוב.
7. **הדפס A4** — ההגדרות מוסתרות, והדף מכיל את הריבוע ואת בנק המילים. סימוני פתרון לא מודפסים.

## Usage

1. Open the app in a browser (`npm run dev` → http://localhost:5173/tifzoret/).
2. Tick any subset of **directions**. Defaults: right-to-left, top-to-bottom, and top-right→bottom-left.
3. Paste seed words (one per line or comma-separated) and click **Add**. Hebrew nikud and spaces are stripped. Bank cap: **50 words**. Max word length: **16 letters**. A word longer than the current grid is blocked, with a CTA to grow the board.
4. Optional:
   - **Random age-10 fill** — extra kid-friendly words from the bundled corpus (offline).
   - **No final letters** — drop words containing ם ן ץ ף ך; those sofit letters also stay out of the grid.
5. Grid size 8–20. Font size defaults to **18pt** (Assistant / Heebo).
6. **Generate** / **Reshuffle**. Each bank word is placed **exactly once**. After random fill, the generator verifies there is no accidental second copy along enabled directions and retries until that holds (or fails clearly).
7. **Print A4** hides settings; print shows the grid and word bank on one A4 page, without solve highlights.

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
