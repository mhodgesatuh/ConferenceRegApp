# npm Commands

The backend project uses the `@/...` path alias consistently across all stages 
of development, build, runtime, and testing. Different tools handle the alias 
in their own way, but the result is the same: imports like `@/utils/logger` 
always resolve to the correct source or build location. The table below shows 
how aliasing is implemented in each environment.

### Path Alias (`@/...`) Matrix

**Mechanism** refers to the specific tool or runtime helper responsible for 
resolving the `@/...` alias in that environment (e.g., `tsconfig-paths`, 
`module-alias`, or the TypeScript compiler itself).


| Environment | Mechanism | Config / Package | Notes |
|-------------|-----------|------------------|-------|
| **Development** (`npm run dev`) | `ts-node-dev` + `tsconfig-paths` | `tsconfig.vitest.json` via root `tsconfig.json`; `tsconfig-paths/register` | Maps `@/...` → `src/...` when running TypeScript directly. |
| **Build** (`npm run build`) | TypeScript compiler | `tsconfig.build.json` → extends `tsconfig.base.json` | Compiles `src/...` to `dist/...`, resolving aliases at build time. |
| **Production Runtime** (`npm start`) | `module-alias` | `_moduleAliases` in `package.json` (`"@": "dist"`) | Maps `@/...` → `dist/...` so imports work after compilation. |
| **Testing** (`npm run test`) | Vitest + tsconfig alias | `vitest.config.ts` (`alias`), `tsconfig.vitest.json` | Ensures `@/...` resolves to `src/...` in test environment. |
