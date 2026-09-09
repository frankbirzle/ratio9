---
title: Linked loops, a slow ramp, and letting the app run my routine
date: 2026-09-09
summary: Three settings I added because I kept doing the same three things by hand. Loop 2 now follows loop 1, the phrase grows on its own, and the tempo steps up two beats at a time.
tags: practice, changelog
---

For a month I ran the ratio trainer the way [the routine](/articles/how-i-use-the-speed-trainer) describes it, and every session had the same rhythm of interruptions. Stop, change loop 2, start. Stop, add two beats to loop 1, fix loop 2 again, start. Stop, nudge the tempo, start. None of that is practice. It is bookkeeping, and it lands exactly where I want to be paying attention to my picking hand instead.

So I taught the app the three things I was doing by hand. This is what changed and why each one is shaped the way it is.

## Loop 2 follows loop 1

The ratio drill alternates eighth-note triplets and sextuplets at one tempo. I always set loop 1 to some number of beats and loop 2 to half of that, and for a while I thought "half" was the rule.

It is not. The rule is that both loops carry the **same number of notes**. Two beats of triplets is six notes. One beat of sextuplets is six notes. Same phrase, played slow and then fast, which is the entire point of the drill. Half only falls out of that because sextuplets are exactly twice as dense as triplets.

Once you see it as a note count, an awkward question answers itself: what does loop 1 with three beats mean? Nine notes of triplets, which is one and a half beats of sextuplets. There is no such loop. Three was never a valid length for this ratio, the app just let me pick it.

So the new **Link loops** setting, on by default, derives loop 2 from loop 1 and the two subdivisions. Loop 1 steps only in lengths that leave loop 2 whole: 2, 4, 6, 8 for triplets against sextuplets, 3, 6, 9 for eighths against triplets. Loop 2 shows the derived value and cannot be edited while linked. If you want two loops with different note counts, switch the link off and everything works as before.

## The phrase grows on its own

Step two of my routine is to extend the fast pass: 2 beats, then 4, then 8. What I actually do at the guitar is a bit finer than that. I run 2:1 for a few rounds, then 4:2, then 6:3, then 8:4, and only then call the tempo done. Each stage is the same lick, just held for longer, and the point of the stage is to find out where the tension creeps in as the pass gets longer.

**Build up the phrase** does that for me. Set loop 1 to the full length you are working towards, say eight beats, and the session starts at the shortest linked phrase and grows loop 1 by one step every time the configured rounds are done. Two beats, four, six, eight, with loop 2 following through the link. The panel shows the phrase as it is being played, so the tick grid and the round counter always match what you hear.

It needs the link, because "one step" only means something when loop 2 can follow.

## Tempo steps, slowly

The speed tab already had a ramp, but it ramps by bars and it belongs to a different drill. What I wanted for the ratios was much lazier: play the rounds, then add two beats per minute, then play the rounds again.

That is what the new **Tempo ramp** does. Set a step and an end tempo. After every full set of rounds the tempo moves up by the step, until the end tempo has had its turn, and then the session ends with the landing beat as usual. The knob shows the live tempo while it plays and drops back to the start tempo when you stop, so the next session begins where you meant it to.

Two is my step because two is barely audible. That is deliberate. The ratio already supplies the big jump, slow to fast, every few beats. The ramp is there to move the whole exercise up the tempo range without ever presenting a speed that feels new.

## How the three combine

With everything on, one session at 60 looks like this:

```
60 bpm   2:1   4:2   6:3   8:4
62 bpm   2:1   4:2   6:3   8:4
64 bpm   2:1   4:2   6:3   8:4
...
```

Every stage at one tempo before the tempo moves. That order matters. Rebuilding the phrase from two beats at each new tempo is the routine's step six, "then start over from one note", and I did not want the app to skip it for me. Higher speeds are a slightly different motion, and the short phrase is where you notice that before the long one hides it.

The round counter now reads `Round 2 / 4 · set 5 / 12`, and the session estimate adds up all the sets, so you know before you start whether the plan fits the twenty minutes you have.

## What did not change

The tempo. It is still one click that never moves inside a set, and the ratio still does the speed work. Everything above is scaffolding around that idea, not a replacement for it. If you are new to the app, leave the ramp and the build-up off, put loop 1 on two beats, and read [why I built this](/articles/why-i-built-a-ratio-trainer) first. The scaffolding is for when the drill itself has become boring enough that you have started fiddling with the settings between rounds, which is exactly the moment I built it.
