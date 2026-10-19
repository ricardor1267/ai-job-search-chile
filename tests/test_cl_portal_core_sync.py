"""Chilean fork: the four Chilean portal CLIs share one core module.

Each CLI ships its own copy of cli/src/core.ts so every portal skill stays
self-contained (runs with plain `bun`, zero runtime dependencies, as the
portal-skill contract in .claude/commands/add-portal.md requires). Copies that
drift apart mean a bug fixed in one portal silently survives in the others, so
this test pins them byte-identical.
"""

import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CL_PORTALS = ("chiletrabajos-search", "computrabajo-search", "trabajando-search", "getonbrd-search")


class ChileanPortalCoreSyncTests(unittest.TestCase):
    def test_core_copies_are_identical(self):
        digests = {}
        for name in CL_PORTALS:
            core = ROOT / ".agents" / "skills" / name / "cli" / "src" / "core.ts"
            self.assertTrue(core.exists(), f"{name}: missing cli/src/core.ts")
            digests[name] = hashlib.sha256(core.read_bytes()).hexdigest()
        self.assertEqual(
            1,
            len(set(digests.values())),
            "cli/src/core.ts differs between Chilean portal CLIs; copy the edited one over the others: "
            + ", ".join(f"{k}={v[:10]}" for k, v in digests.items()),
        )

    def test_each_chilean_portal_has_the_contract_files(self):
        for name in CL_PORTALS:
            base = ROOT / ".agents" / "skills" / name
            for rel in ("SKILL.md", "url-reference.md", "cli/package.json", "cli/src/cli.ts",
                        "cli/src/commands/search.ts", "cli/src/commands/detail.ts", "cli/tests/helpers.ts"):
                self.assertTrue((base / rel).exists(), f"{name}: missing {rel}")


if __name__ == "__main__":
    unittest.main()
