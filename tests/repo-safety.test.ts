import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Static guards: the secret key never reaches client code, and the migration keeps
// the security model (RLS, explicit grants, no public writes, bucket limits).

const ROOT = join(__dirname, "..");
const SOURCE_DIRS = ["app", "components", "lib"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const files = SOURCE_DIRS.flatMap(dir => sourceFiles(join(ROOT, dir)));

describe("secret key isolation", () => {
  it("is only referenced from the server-only admin client", () => {
    const users = files.filter(file => readFileSync(file, "utf8").includes("SUPABASE_SERVICE_ROLE_KEY"));
    expect(users.map(file => file.slice(ROOT.length + 1).replace(/\\/g, "/"))).toEqual(["lib/supabase/admin.ts"]);
    expect(readFileSync(join(ROOT, "lib/supabase/admin.ts"), "utf8")).toMatch(/^import "server-only";/);
  });

  it("client components never import server modules", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (!source.startsWith('"use client"')) continue;
      expect(source, file).not.toMatch(/@\/lib\/server\/|@\/lib\/supabase\/(admin|server|public)/);
    }
  });

  it("does not ship real keys in .env.example", () => {
    const example = readFileSync(join(ROOT, ".env.example"), "utf8");
    for (const line of example.split(/\r?\n/).filter(entry => entry && !entry.startsWith("#"))) {
      expect(line).toMatch(/^[A-Z_]+=$/);
    }
  });
});

describe("migration", () => {
  const dir = join(ROOT, "supabase/migrations");
  const sql = readdirSync(dir).map(name => readFileSync(join(dir, name), "utf8")).join("\n").toLowerCase();

  it("enables RLS and grants explicit privileges", () => {
    expect(sql).toContain("alter table public.site_content enable row level security");
    expect(sql).toContain("alter table public.admins enable row level security");
    expect(sql).toContain("grant select, insert, update, delete on table public.site_content to service_role");
    expect(sql).toContain("grant select, insert, update, delete on table public.admins to service_role");
    expect(sql).toContain("revoke all on table public.admins from public, anon, authenticated");
  });

  it("never grants writes to anon or authenticated", () => {
    expect(sql).not.toMatch(/grant[^;]*(insert|update|delete)[^;]*to[^;]*(anon|authenticated)/);
    expect(sql).not.toMatch(/create policy[^;]*for (insert|update|delete|all)/);
  });

  it("configures a single owner and the image bucket limits", () => {
    expect(sql).toContain("where role = 'owner'");
    expect(sql).toContain("4194304");
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) expect(sql).toContain(type);
  });
});
