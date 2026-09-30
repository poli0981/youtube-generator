/**
 * CLI for scripts/lib/third-party.ts:
 *
 *   npm run generate:third-party   rewrite THIRD_PARTY_NOTICES.md
 *   npm run check:licenses          verify it is current and every bundled
 *                                   package has an allowed license
 */
import { main } from "./lib/third-party";

main();
