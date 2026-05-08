import type { Database } from "@ripscloud/db";
import { examples } from "@ripscloud/db";
import type { CreateExampleInput } from "@ripscloud/domain";
import type { Logger } from "@ripscloud/logger";

type Deps = {
  db: Database;
  log: Logger;
};

type Result = {
  id: string;
};

export async function createExample(deps: Deps, input: CreateExampleInput): Promise<Result> {
  const { db, log } = deps;

  log.info("creating example", { slug: input.slug });

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(examples).values({
    id,
    ...input,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  log.debug("example created", { id });

  return { id };
}
