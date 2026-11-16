/** The four steps of the Home "How we build" section. Each step has its own background photo (slot). */
export const processSteps = [
  {
    title: "Find the friction",
    body: "We sit with the people who do the work and map where the hours disappear: the retyping, the chasing, the reading of small print.",
    slot: "home-step-1",
  },
  {
    title: "Design the review step first",
    body: "Every product drafts and a person decides. We design the moment of review before anything else, so nothing is sent without you.",
    slot: "home-step-2",
  },
  {
    title: "Build on sources, not guesses",
    body: "Answers point to the document they came from, and say so plainly when they cannot back something up.",
    slot: "home-step-3",
  },
  {
    title: "Test with real people, then ship",
    body: "Small releases to the people on each waitlist, measured by the time they get back.",
    slot: "home-step-4",
  },
] as const;
