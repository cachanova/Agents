# Plan Files

A plan file is a living document. It reflects current state, not the original
plan. While working through one, update it continuously with implementation
notes, design decisions, and status.

## Campaign marker (status line)

The status line charts the plan the chat is working through. It binds to a plan
when you edit it, and shows the plan's numbered stage headings plus your
position in the current stage.

- **Checkbox plans** (superpowers, `*_TASKS.md`): tick `- [ ]` to `- [x]` the
  moment a step is done. Ticking is the progress update.
- **Multi-stage prose plans** (numbered stage headings): keep one marker at the
  top of the file. Edit it when you start working the plan in a chat and every
  time a stage, sub-stage, or gate starts or finishes:

  ```text
  <!-- campaign: stage=<heading number> gate="<current sub-stage or gate>" progress=<done>/<total> -->
  ```

  `stage` must match a stage heading's number. Use `stage=done` when the
  campaign is complete. Omit `progress` when the stage has no countable gates.
- Never set the marker ahead of the verified state.
