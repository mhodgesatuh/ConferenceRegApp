# Configuration Files

<!-- TOC -->
* [Configuration Files](#configuration-files)
  * [tsconfig.base.json](#tsconfigbasejson)
  * [tsconfig.build.json](#tsconfigbuildjson)
  * [tsconfig.vitest.json](#tsconfigvitestjson)
  * [tsconfig.json](#tsconfigjson-)
  * [package.json](#packagejson)
  * [vitest.config.ts](#vitestconfigts)
  * [drizzle.config.ts](#drizzleconfigts)
<!-- TOC -->

## tsconfig.base.json

The foundation.

- **Purpose**: Shared compiler settings for the backend build (emit → `dist/`) and for general IDE IntelliSense.
- **Notable** settings: `rootDir: "src"`, `outDir: "dist"`, `CJS runtime ("module": "CommonJS", "moduleResolution": "node")`, path alias `@/* → src/*`, strictness and incremental builds enabled.
- **Consumers**: Extended by **tsconfig.build.json** and **tsconfig.vitest.json**.

## tsconfig.build.json

Build only.

- **Purpose**: Inherits base settings, just adds `tsBuildInfoFile` and scopes files to compile.
- **Behavior**: `tsc -p tsconfig.build.json` emits JS to `dist/`, using aliases from the base config.
- **Consumers**: Used by `npm run build`.

## tsconfig.vitest.json

For tests + typechecking.

- **Purpose**: Inherits base, but **noEmit** and test-friendly overrides (targets Node 2022 APIs, adds `types: ["node","vitest/globals"]`, narrows `include`, keeps strictness).
- **Behavior**: Ensures IDE/test runner see `@/*` correctly, doesn’t generate JS.
- **Consumers**: Used by `vitest`, `npm run typecheck`, and (via root **tsconfig.json**) your IDE default.

## tsconfig.json 

The root selector.

- **Purpose**: Points the workspace default to **tsconfig.vitest.json** so the IDE and quick “tsc” runs behave like test/typecheck config by default.
- **Consumers**: Your editor; not used by the build script.

## package.json

For scripts + runtime glue.

- **Dev**: `ts-node-dev ... -r tsconfig-paths/register src/index.ts` → TypeScript runs directly, and tsconfig-paths maps `@/...` → `src/...`.
- **Build**: `tsc -p tsconfig.build.json` emits to `dist/`.
- **Prod runtime**: `node -r module-alias/register dist/index.js` with `"_moduleAliases": { "@": "dist" }` → at runtime, imports like `"@/utils/logger"` resolve to built files inside dist.
- **Testing**: `vitest --config vitest.config.ts` relies on `tsconfig.vitest.json` for path mapping/types.

## vitest.config.ts

For the test runner alias.

- **Purpose**: Mirrors the `@` → `src` alias for Vitest’s resolver, matching `tsconfig.vitest.json`. The `import * as path` style here avoids the `esModuleInterop` default-import warning.

## drizzle.config.ts

For drizzle-kit CLI configuration.

- **Purpose**: Drizzle migrations/config. Reads envs to connect.
- **Note**: If `.env` isn’t auto-loaded in the context you run Drizzle, this file will not see values (you’re throwing on missing envs). Consider explicitly loading dotenv here.