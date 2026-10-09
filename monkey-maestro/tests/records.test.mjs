import { describe, expect, test } from "bun:test";
import path from "node:path";

import {
  RecordValidationError,
  buildControlRecord,
  parseControlRecord,
  resolveControlAuthority,
  serializeRecord,
} from "../lib/records.mjs";

const controlInput = {
  projectId: "project-1",
  runId: "run-1",
  active: true,
  deliveryScope: "issue-through-merge",
  targetHostId: "host-1",
  supersetProjectId: "superset-project",
  workspaceGroup: "commerce · 2026-10-09 10:00 utc · run-1",
  defaultAgent: "codex",
  updatedAt: "2026-10-09T10:00:00.000Z",
};

function envelope(record, version = record.schemaVersion) {
  return `<!-- nuthouse:maestro-control schema_version=${version} -->\n\n\`\`\`json\n${JSON.stringify(record)}\n\`\`\`\n`;
}

describe("Maestro delivery authority", () => {
  test("the CLI resolves only the exact project's authorized control", () => {
    const script = path.resolve(import.meta.dir, "..", "scripts", "records.mjs");
    const comments = [{ id: "comment-1", body: serializeRecord(buildControlRecord(controlInput)) }];
    const result = Bun.spawnSync({
      cmd: [process.execPath, script, "resolve-controls"],
      stdin: new Blob([JSON.stringify({ projectId: "project-1", comments })]),
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString())).toMatchObject({
      ok: true,
      authority: {
        status: "valid",
        control: {
          schemaVersion: 3,
          projectId: "project-1",
          deliveryScope: "issue-through-merge",
          workspaceGroup: controlInput.workspaceGroup,
        },
      },
    });
    expect(result.stderr.toString()).toBe("");
    expect(
      resolveControlAuthority(comments, { expectedProjectId: "another-project" }),
    ).toMatchObject({ status: "invalid", reason: "CONTROL_PROJECT_MISMATCH" });
  });

  test("round trips explicit delivery authority without copying runtime or graph state", () => {
    const record = buildControlRecord(controlInput);
    expect(record).toEqual({ ...controlInput, schemaVersion: 3, maxConcurrency: 4, revision: 1 });
    expect(parseControlRecord(serializeRecord(record))).toEqual(record);
    expect(() => serializeRecord({ ...record, pendingIssues: ["TEAM-1"] })).toThrow(
      "unsupported fields: pendingIssues",
    );
  });

  test("normalizes the workspace group before persisting or comparing a same-run successor", () => {
    const input = {
      ...controlInput,
      workspaceGroup: "  Commerce · 2026-10-09 10:00 UTC · run-1  ",
    };
    const existing = buildControlRecord(input);
    expect(existing.workspaceGroup).toBe(controlInput.workspaceGroup);
    expect(
      parseControlRecord(envelope({ ...existing, workspaceGroup: input.workspaceGroup })),
    ).toEqual(existing);
    expect(buildControlRecord({ ...input, runId: "  run-1  " }, existing)).toEqual({
      ...existing,
      revision: 2,
    });
  });

  test.each([
    [`  ${"A".repeat(64)}  `, "a".repeat(64)],
    [`${"A".repeat(62)}İ`, `${"a".repeat(62)}i\u0307`],
    ["🐵".repeat(32), "🐵".repeat(32)],
  ])("accepts 64 normalized workspace-tag code units: %p", (workspaceGroup, normalized) => {
    const record = buildControlRecord({ ...controlInput, workspaceGroup });
    expect(record.workspaceGroup).toBe(normalized);
    expect(parseControlRecord(envelope({ ...record, workspaceGroup }))).toEqual(record);
  });

  test.each(["a".repeat(65), `${"A".repeat(63)}İ`, "🐵".repeat(33)])(
    "rejects a workspace tag above 64 normalized code units: %p",
    (workspaceGroup) => {
      expect(() => buildControlRecord({ ...controlInput, workspaceGroup })).toThrow(
        "workspaceGroup must be at most 64 characters",
      );
      expect(() =>
        parseControlRecord(envelope({ ...buildControlRecord(controlInput), workspaceGroup })),
      ).toThrow("workspaceGroup must be at most 64 characters");
    },
  );

  test("requires a workspace group on fresh controls and parsed comments", () => {
    const input = { ...controlInput };
    delete input.workspaceGroup;
    expect(() => buildControlRecord(input)).toThrow("workspaceGroup");
    expect(() =>
      parseControlRecord(envelope({ ...input, schemaVersion: 3, revision: 1, maxConcurrency: 4 })),
    ).toThrow("workspaceGroup");
  });

  test.each([
    undefined,
    null,
    "",
    "   ",
    7,
    {},
    "first,second",
    "group\n",
    "\rgroup",
    "group\tname",
    "group\u0000name",
    "group\u007fname",
    "group\u0085name",
  ])("rejects a malformed single workspace tag: %p", (workspaceGroup) => {
    expect(() => buildControlRecord({ ...controlInput, workspaceGroup })).toThrow("workspaceGroup");
    expect(() =>
      parseControlRecord(
        envelope({
          ...controlInput,
          workspaceGroup,
          schemaVersion: 3,
          revision: 1,
          maxConcurrency: 4,
        }),
      ),
    ).toThrow("workspaceGroup");
  });

  test.each([true, false])("cannot change a run's workspace group with active=%p", (active) => {
    const existing = buildControlRecord(controlInput);
    expect(() =>
      buildControlRecord(
        { active, workspaceGroup: "Another folder", updatedAt: controlInput.updatedAt },
        existing,
      ),
    ).toThrow("workspaceGroup cannot change within a run");
  });

  test("a fresh run requires an explicit group separate from the previous run", () => {
    const existing = buildControlRecord(controlInput);
    const input = { runId: "run-2", updatedAt: "2026-10-09T11:00:00.000Z" };
    expect(() => buildControlRecord(input, existing)).toThrow("workspaceGroup");
    expect(() =>
      buildControlRecord({ ...input, workspaceGroup: `  ${existing.workspaceGroup}  ` }, existing),
    ).toThrow("a new run must use a different workspaceGroup");
    expect(() =>
      buildControlRecord(
        { ...input, workspaceGroup: existing.workspaceGroup.toUpperCase() },
        existing,
      ),
    ).toThrow("a new run must use a different workspaceGroup");

    const workspaceGroup = "commerce · 2026-10-09 11:00 utc · run-2";
    const next = buildControlRecord({ ...input, workspaceGroup }, existing);
    expect(next).toEqual({ ...existing, ...input, workspaceGroup, revision: 2 });
    expect(parseControlRecord(serializeRecord(next))).toEqual(next);
  });

  test.each([undefined, null, "", "dispatch-only", "merge-everything"])(
    "requires explicit full issue delivery scope: %p",
    (deliveryScope) => {
      expect(() => buildControlRecord({ ...controlInput, deliveryScope })).toThrow("deliveryScope");
    },
  );

  test.each([1, 2, 4])(
    "rejects unsupported schema %s without projecting authority",
    (schemaVersion) => {
      const record = { ...controlInput, schemaVersion, revision: 7, maxConcurrency: 3 };
      expect(() => parseControlRecord(envelope(record))).toThrow("unsupported schemaVersion");
      expect(
        resolveControlAuthority([{ id: "unsupported", body: envelope(record) }]),
      ).toMatchObject({
        status: "invalid",
        control: null,
        revision: 7,
        reason: "UNSUPPORTED_SCHEMA",
      });
      expect(() => buildControlRecord({ active: true }, record)).toThrow(
        "unsupported schemaVersion",
      );
    },
  );

  test("reactivation starts from explicit input above the observed revision", () => {
    const next = buildControlRecord({ ...controlInput, previousRevision: 7 });
    expect(next.revision).toBe(8);
    expect(next).not.toHaveProperty("previousRevision");
    expect(() =>
      buildControlRecord({ ...controlInput, deliveryScope: undefined, previousRevision: 7 }),
    ).toThrow("deliveryScope");
  });

  test("stop preserves scope, transport, and workspace group while advancing the same run", () => {
    const existing = buildControlRecord({ ...controlInput, maxConcurrency: 10 });
    const next = buildControlRecord(
      { active: false, updatedAt: "2026-10-09T10:05:00.000Z" },
      existing,
    );
    expect(next).toEqual({
      ...existing,
      active: false,
      revision: 2,
      updatedAt: "2026-10-09T10:05:00.000Z",
    });
  });

  test("cannot inherit an existing project's authority into another project", () => {
    expect(() =>
      buildControlRecord(
        { projectId: "another-project", updatedAt: controlInput.updatedAt },
        buildControlRecord(controlInput),
      ),
    ).toThrow("project");
  });

  test("successor project identity uses the same normalization as a fresh control", () => {
    const existing = buildControlRecord(controlInput);
    const input = { ...controlInput, projectId: "  project-1\n" };
    expect(buildControlRecord(input, existing)).toMatchObject({
      projectId: buildControlRecord(input).projectId,
      revision: existing.revision + 1,
    });
    expect(() =>
      buildControlRecord({ ...input, projectId: " another-project " }, existing),
    ).toThrow("cannot inherit authority into another project");
  });

  test.each([null, -1, 1.5, Number.MAX_SAFE_INTEGER, "7"])(
    "rejects unsafe revision base %p",
    (previousRevision) => {
      expect(() => buildControlRecord({ ...controlInput, previousRevision })).toThrow(
        RecordValidationError,
      );
    },
  );

  test("does not let a supplied revision base override the existing record", () => {
    const existing = buildControlRecord(controlInput);
    expect(
      buildControlRecord(
        { previousRevision: existing.revision, updatedAt: controlInput.updatedAt },
        existing,
      ).revision,
    ).toBe(existing.revision + 1);
    expect(() =>
      buildControlRecord({ previousRevision: 99, updatedAt: controlInput.updatedAt }, existing),
    ).toThrow("previousRevision");
  });

  test.each([0, 11, 1.5])("rejects invalid concurrency %s", (maxConcurrency) => {
    expect(() => buildControlRecord({ ...controlInput, maxConcurrency })).toThrow(
      RecordValidationError,
    );
  });

  test.each([undefined, null, "", "   "])(
    "requires a resolved default agent: %p",
    (defaultAgent) => {
      expect(() => buildControlRecord({ ...controlInput, defaultAgent })).toThrow("defaultAgent");
    },
  );

  test("rejects mismatched envelope and body versions", () => {
    expect(() =>
      parseControlRecord(envelope({ ...buildControlRecord(controlInput), schemaVersion: 2 }, 3)),
    ).toThrow("schema versions differ");
  });

  test("a newer invalid control disables the older valid authority", () => {
    const older = buildControlRecord(controlInput);
    const newer = { ...buildControlRecord(controlInput, older), deliveryScope: "dispatch-only" };
    expect(
      resolveControlAuthority([
        { id: "control-old", body: serializeRecord(older) },
        { id: "control-new-invalid", body: envelope(newer) },
      ]),
    ).toMatchObject({
      status: "invalid",
      control: null,
      controlCommentId: "control-new-invalid",
      revision: 2,
    });
  });

  test("an unorderable control fails closed instead of hiding behind a valid one", () => {
    expect(
      resolveControlAuthority([
        { id: "valid", body: serializeRecord(buildControlRecord(controlInput)) },
        { id: "broken", body: "<!-- nuthouse:maestro-control schema_version=3 -->\n```json\n{" },
      ]),
    ).toMatchObject({ status: "invalid", control: null, revision: null });
  });

  test("duplicate highest revisions cannot elect a supervisor", () => {
    const control = buildControlRecord(controlInput);
    expect(
      resolveControlAuthority([
        { id: "control-a", body: serializeRecord(control) },
        { id: "control-b", body: serializeRecord({ ...control, runId: "run-2" }) },
      ]),
    ).toMatchObject({
      status: "ambiguous",
      control: null,
      revision: 1,
      controlCommentIds: ["control-a", "control-b"],
    });
  });
});
