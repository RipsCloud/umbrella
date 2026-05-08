import type { Database } from "@ripscloud/db";
import { examples } from "@ripscloud/db";
import type { ExampleResponse } from "@ripscloud/domain";
import type { Logger } from "@ripscloud/logger";

type Deps = {
  db: Database;
  log: Logger;
};

export async function listExamples(deps: Deps): Promise<ExampleResponse[]> {
  const { db, log } = deps;

  log.debug("listing examples");

  const rows = await db.select().from(examples);
  return rows as ExampleResponse[];
}
