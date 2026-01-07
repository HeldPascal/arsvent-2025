# Content Diagnostics Catalog

Grouped by source, then severity (error → warning → info).

## Content (source: `content`)
**Error**
- `CONTENT_LOAD_ERROR` — Failed to load a content variant (non-ENOENT errors).
- `CONTENT_FILE_UNREADABLE` — Content file exists but cannot be read (permissions, etc.).
- `CONTENT_UNSUPPORTED_VERSION` — Content version is missing or unsupported.
- `CONTENT_ID_MISSING` — Required frontmatter id is missing.
- `CONTENT_META_MISSING` — Required frontmatter metadata (mode/locale) is missing.
- `CONTENT_PUZZLE_TYPE_UNSUPPORTED` — Puzzle type is not supported.
- `CONTENT_SOLUTION_INVALID` — Puzzle solution references a non-existent option.
- `CONTENT_VALIDATION_ERROR` — Content failed validation while loading (e.g., missing required puzzle fields).

**Warning**
- `CONTENT_VARIANT_MISSING` — Content file for a variant is missing.
- `CONTENT_META_MISMATCH` — Frontmatter locale/mode differs from requested variant.
- `CONTENT_FILENAME_MISMATCH` — Filename does not match locale/mode implied by metadata.
- `CONTENT_RELEASE_MISSING` — Release timestamp is missing.
- `CONTENT_TITLE_MISSING` — Title is missing from content.
- `CONTENT_BLOCK_ID_DUPLICATE` — Duplicate block id within a content file.
- `CONTENT_VISIBILITY_INVALID` — Puzzle visibility flag is invalid or missing.
- `CONTENT_OPTION_DUPLICATE` — Duplicate option id within a puzzle.
- `CONTENT_SOCKET_DUPLICATE` — Duplicate socket id within a drag-sockets puzzle.
- `CONTENT_ITEM_DUPLICATE` — Duplicate item id within a drag-sockets puzzle.
- `CONTENT_CARD_DUPLICATE` — Duplicate card id within a memory puzzle.
- `CONTENT_INDEX_WARNING` — Indexing issues (filename mismatches, duplicates, etc.).
- `CONTENT_VARIANT_DUPLICATE` — Duplicate content variant detected during indexing.
- `CONTENT_ID_DUPLICATE` — Content id reused for a different day or mode.
- `INTRO_LOAD_ERROR` — Failed to load an intro file for a locale.

**Info**
- `CONTENT_META_UNKNOWN` — Unknown or unexpected frontmatter keys were found.
- `CONTENT_FILE_UNUSED` — Content file is outside the configured day range.

## Link (source: `link`)
**Error**
- `CONTENT_REWARD_INVALID` — Reward references an inventory id that does not exist.

**Warning**
- `CONTENT_REWARD_WRONG_LOCALE` — Reward references an inventory id that only exists in another locale.

## Asset (source: `asset`)
**Error**
- `ASSET_NOT_FOUND` — Referenced asset is missing on disk.
- `ASSET_UNREADABLE` — Asset exists but cannot be read (permissions/corruption).
- `ASSET_OUT_OF_ROOT` — Asset path escapes the allowed assets root.
- `ASSET_EMPTY` — Asset file exists but is zero bytes.

**Warning**
- `ASSET_REMOTE_PATH` — Asset uses a remote/data URL where local path is expected.
- `ASSET_UNSUPPORTED_EXT` — Asset extension is not in the allowed set.
- `ASSET_CASE_MISMATCH` — Referenced path casing differs from filesystem (can break on some platforms).

**Info**
- `ASSET_DUPLICATE_HASH` — Multiple files share identical content (same hash).
- `ASSET_UNUSED` — Asset on disk is not referenced by content or inventory.

## Inventory (source: `inventory`)
**Error**
- `INVENTORY_FILE_MISSING` — Inventory YAML file for a locale is missing.
- `INVENTORY_PARSE_ERROR` — Inventory YAML could not be parsed into a list.
- `INVENTORY_ITEM_INVALID` — Inventory item missing required fields (id/title/description/image/rarity).

**Warning**
- `INVENTORY_ID_DUPLICATE` — Duplicate inventory id within the same locale file.
- `INVENTORY_ID_INVALID` — Inventory id contains unsupported characters.

**Info**
- `INVENTORY_FIELD_WHITESPACE` — Inventory field contains leading/trailing whitespace.
- `INVENTORY_IMAGE_REUSED` — Same inventory image used by multiple items.
- `INVENTORY_ITEM_UNUSED` — Inventory item is not referenced by any content rewards.
- `INVENTORY_EXTRA_LOCALE` — Inventory file exists for an unsupported locale.

## Consistency (source: `consistency`)
**Warning**
- `INVENTORY_INCONSISTENT` — Cross-locale inventory mismatch (missing/extra ids).
- `CONTENT_CROSS_LOCALE_ID_MISMATCH` — Content ids differ between locales for the same day/mode. *(Temporarily disabled; id patterns and handling are not finalized.)*

**Info**
- `CONTENT_CROSS_LOCALE_TITLE_MISMATCH` — Content titles differ between locales for the same day/mode.
