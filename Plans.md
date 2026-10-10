# Plans

A plan file reflects current state, not the original plan. Update it as you
work: implementation notes, decisions, status.

## Campaign marker

The status line binds to the plan you edit and shows its numbered stage
headings plus your position.

- Checkbox plans (superpowers, `*_TASKS.md`): tick `- [ ]` to `- [x]` as each
  step finishes. That is the progress update.
- Multi-stage prose plans: keep one marker at the top. Edit it when you start
  and whenever a stage, sub-stage, or gate starts or finishes:

  ```text
  <!-- campaign: stage=<heading number> gate="<current gate>" progress=<done>/<total> -->
  ```

  `stage` matches a heading number; `stage=done` when complete. Omit
  `progress` when the stage has no countable gates.
- Never set the marker ahead of verified state.
