import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsers, pool } from "@workspace/db";

async function run(): Promise<void> {
  const email = (process.env["ADMIN_EMAIL"] ?? process.argv[2] ?? "")
    .trim()
    .toLowerCase();
  const password = process.env["ADMIN_PASSWORD"] ?? process.argv[3] ?? "";
  const name = (process.env["ADMIN_NAME"] ?? process.argv[4] ?? "").trim();

  if (!email || !password || !name) {
    throw new Error(
      "Usage: pnpm --filter @workspace/scripts seed-admin <email> <password> <name>\n" +
        "   or set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME env vars",
    );
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminUsers)
      .set({ passwordHash, name })
      .where(eq(adminUsers.email, email));
    console.log(`Updated existing admin: ${email}`);
  } else {
    const [row] = await db
      .insert(adminUsers)
      .values({ email, passwordHash, name })
      .returning({ id: adminUsers.id });
    console.log(`Seeded admin: ${email} (id=${row?.id})`);
  }
}

let exitCode = 0;
try {
  await run();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  exitCode = 1;
} finally {
  await pool.end().catch(() => {});
  process.exit(exitCode);
}
