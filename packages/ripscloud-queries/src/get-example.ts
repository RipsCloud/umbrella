import { eq } from "drizzle-orm";
import type { Database } from "@ripscloud/ripscloud-db";
import { examples } from "@ripscloud/ripscloud-db";
import type { ExampleResponse } from "@ripscloud/ripscloud-domain";
import type { Logger } from "@ripscloud/ripscloud-logger";

type Deps = {
  db: Database;
  log: Logger;
};

export async function getExample(deps: Deps, id: string): Promise<ExampleResponse | null> {
  const { db, log } = deps;

  log.debug("getting example", { id });

  const row = await db
    .select()
    .from(examples)
    .where(eq(examples.id, id))
    .get();

  return (row as ExampleResponse) ?? null;
}
