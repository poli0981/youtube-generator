/**
 * CLI for scripts/lib/copyright.ts:
 *
 *   npm run check:copyright    verify NOTICE, REUSE.toml and tauri.conf.json
 *                              state the copyright years for HEAD's year
 *   npm run update:copyright   rewrite them to those years
 */
import { main } from "./lib/copyright";

main();
