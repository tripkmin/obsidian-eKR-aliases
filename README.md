# eKR Aliases for Obsidian

> Generate `(eKR)` aliases that pair Korean text with its Dubeolsik keyboard transliteration.

## Features

-   Reads the note title plus every value inside the frontmatter `aliases` array.
-   Removes previously generated `(eKR)` entries before creating fresh ones in the format `(eKR) {Original} | {Transliteration}`.
-   Works on individual files, every note inside the current folder, or the entire vault.

## Commands

-   `Refresh eKR aliases (current file)`: Updates the active Markdown file.
-   `Refresh eKR aliases (current folder)`: Recursively updates every Markdown file that lives under the active file’s parent folder.
-   `Refresh eKR aliases (entire vault)`: Updates all Markdown files returned by `app.vault.getMarkdownFiles()`.
-   Ribbon button: mirrors the “current file” command for quick access.

Each command shows a summary notice and logs detailed error information to the developer console when something fails.

## Usage

1. Run `npm install`.
2. Use `npm run dev` during development or `npm run build` for production bundles.
3. Copy `main.js`, `manifest.json`, and `styles.css` into `<Vault>/.obsidian/plugins/obsidian-eKR-aliases/`.
4. Enable the plugin in Obsidian, then trigger one of the commands above via the command palette or the ribbon icon.

The plugin rewrites only the note frontmatter; the body content stays untouched.

## Development Notes

-   Built with TypeScript and bundled via esbuild (see `esbuild.config.mjs`).
-   Core logic lives in `src/alias-updater.ts` and `src/transliterate.ts`.
-   Scope-aware helpers reuse the same updater so there’s no divergence between single-file and batch executions.

---

# eKR Aliases 플러그인

> `(eKR)` 접두사를 가진 alias를 자동으로 생성해 한국어 문자열과 두벌식(QWERTY) 입력값을 함께 보관합니다.

## 주요 기능

-   노트 제목과 frontmatter `aliases` 배열을 읽어 원문 문자열을 수집합니다.
-   기존 `(eKR)` alias를 전부 제거한 뒤 `(eKR) {원문} | {두벌식}` 형식으로 다시 생성합니다.
-   단일 파일, 현재 폴더 전체, 볼트 전체 단위로 실행할 수 있습니다.

## 명령어

-   `Refresh eKR aliases (current file)`: 현재 활성화된 마크다운 파일만 업데이트합니다.
-   `Refresh eKR aliases (current folder)`: 현재 파일이 속한 폴더(하위 폴더 포함)의 모든 마크다운 파일을 순회합니다.
-   `Refresh eKR aliases (entire vault)`: 볼트의 모든 마크다운 파일을 대상으로 실행합니다.
-   좌측 리본 아이콘: “current file” 명령을 빠르게 실행합니다.

각 명령은 결과 요약을 알림으로 보여 주며, 실패 시 콘솔에 자세한 오류 정보를 남깁니다.

## 사용 방법

1. `npm install`로 의존성을 설치합니다.
2. 개발 중에는 `npm run dev`, 배포용 번들을 만들 때는 `npm run build`를 실행합니다.
3. 생성된 `main.js`, `manifest.json`, `styles.css` 파일을 `<Vault>/.obsidian/plugins/obsidian-eKR-aliases/` 경로에 복사합니다.
4. Obsidian에서 플러그인을 활성화한 뒤 명령 팔레트나 리본 아이콘으로 원하는 스코프의 명령을 선택합니다.

플러그인은 frontmatter만 변경하며, 본문 내용은 수정하지 않습니다.

## 개발 메모

-   TypeScript + esbuild 조합을 사용하며 설정은 `esbuild.config.mjs`에 있습니다.
-   주요 로직은 `src/alias-updater.ts`, 변환기는 `src/transliterate.ts`에서 확인할 수 있습니다.
-   배치 명령도 단일 파일 업데이트 함수를 그대로 재사용해 일관된 결과를 보장합니다.
