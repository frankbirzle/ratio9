---
title: Why I built a ratio trainer instead of another metronome
date: 2026-08-08
summary: A book about talent hotbeds, five YouTube guitarists saying variations of the same thing, and a plateau that would not move. This is what came out of it.
tags: origin, practice
---

Hey, my name is Frank. I am a beginner to mid-level guitar player, and I am currently stuck at what I think is mostly a speed plateau.

You probably know the shape of it. I can play a lick cleanly at 80. I can play it at 90. At 100 it turns to mush, and no amount of patient 5 BPM increments moves that wall. Up, break, back down, clean again, and a month later the wall has not moved an inch.

## The book that started it

I heard about it on a podcast: *The Talent Code* by Daniel Coyle. Coyle travelled to what he calls talent hotbeds, small unremarkable places producing a wildly disproportionate number of world-class performers, a tennis club in Moscow, a music school in upstate New York, a football pitch in Brazil, and asked what they had in common.

His answer runs through myelin, the fatty sheath that insulates nerve fibres. The argument is that correct, effortful repetition at the edge of your ability causes your body to wrap the relevant circuits in more myelin, that thicker myelin means faster and cleaner signal, and that this is the physical substrate of skill. Deep practice builds myelin, myelin is mastery.

That book reframed practice for me, and it is why I started paying attention to *how* I was practising rather than just how long. I will add one honest caveat, because I went looking for the underlying research afterwards and it is thinner than the book suggests. I wrote that up separately in [the myelin story](/articles/the-myelin-story). The short version: keep the emphasis on precise, attentive repetition, drop myelin as the reason it works.

## Five people saying the same thing in different words

Once I started looking, a pattern kept surfacing across guitar YouTube. Different players, different genres, very different personalities, converging on the same handful of ideas.

[JustinGuitar](https://www.justinguitar.com) puts it most memorably:

> Practice makes permanent. Perfect practice makes perfect.

Which is the same idea as Coyle's, minus the neuroscience, and arguably more useful for it. What you repeat is what you get, so be careful what you repeat.

[Ben Eller](https://www.youtube.com/channel/UCcLsvLJOecfCL6RplXhaO4Q) hammers the same point from the opposite direction in *This Is Why You Suck At Guitar*: the reason a passage is not working is almost never that you need more speed, it is that something specific and identifiable is broken and you have not isolated it.

The most useful version of that advice I picked up is a four-step loop, and it is the one thing I would keep if I had to throw the rest away. Catch the exact moment the error happens, not "that run was messy" but the specific note or transition. Go back a step: drop the tempo and shrink the material to the smallest fragment that still contains the failure. Then, slowly and deliberately, work out what actually caused it, a late fretting finger, hands drifting out of sync, tension in the wrist, a string change the picking hand was not set up for. Only then speed it back up, until the error disappears.

The diagnosis step is the one everybody skips, myself included, because playing it again feels like progress and thinking about it does not. But a repetition contains no diagnosis. Play a passage fifty times without isolating what fails and you have installed the fault fifty times more securely. That is [the same conclusion the research points at](/articles/the-myelin-story), arrived at by people who never read the research.

[Bernth](https://www.youtube.com/bernthguitar) and [Lukas Kocka](https://www.youtube.com/c/LukasKocka) both go hard on hand synchronisation and on staying relaxed at tempo, which turns out to be the actual bottleneck far more often than raw hand speed.

[Matt Wright Music](https://www.youtube.com/@mattwright466) made an excellent three-part series on building speed that pulled a lot of this together for me, and it is where I first properly ran into two-way pickslanting, the mechanic [Troy Grady](https://troygrady.com) pioneered and documented in Cracking the Code. If you have never seen his [explanation of what two-way pickslanting actually is](https://troygrady.com/2018/07/16/what-is-two-way-pickslanting-and-how-does-it-work/), it is worth an hour of your life. It explains why some players' picking hands look effortless at 150 BPM while yours fights the strings.

## The video that made it click

The one that reorganised how I practise is [NathanGuitar's *The Boring But 100% Guaranteed Way To Build Insane Speed*](https://www.youtube.com/watch?v=Jp-xitAS1kQ).

His argument is about removing complexity. If you are trying to build speed on a lick that crosses three strings, you are simultaneously working on picking-hand speed, fretting-hand accuracy, hand synchronisation, and string changes. Four problems at once, so when it breaks you cannot tell which one broke.

So: take a three-note sequence. Put it on one string. Get it fast and synchronised there, then move it up the neck. Only once left and right hands are genuinely locked together do you let string changes back into the picture, at which point two-way pickslanting and the rest of the mechanical machinery becomes the thing you are actually working on, instead of a confound.

That is obviously correct once someone says it out loud, and I had never practised that way in my life.

## What slow practice does not do

There is one more piece, and it is the piece that turned into this app.

Slow practice refines a motion you already have. It cleans up synchronisation, it lets you notice tension, it makes a phrase familiar. What it does not do is build the fast motion, because past a certain tempo the fast motion is *a different movement*. Above roughly 110 BPM in sixteenths, most players are no longer making a series of discrete picking strokes with time to think in between. They are running a continuous oscillation and steering it.

You cannot arrive at an oscillation by making discrete strokes progressively quicker. That is why the 5 BPM ladder stalls: it asks the slow movement to gradually become the fast one, and at some point it simply cannot.

## The ratio

What broke the plateau was not a tempo ladder. It was alternating subdivisions against a fixed pulse.

Set the click to 70 BPM. Play two bars of eighth-note triplets, three notes per click. Then, without touching the click, play two bars of sextuplets, six notes per click. The beat has not moved. Your hand has just doubled its speed.

At 70 BPM, triplets are 210 notes per minute and sextuplets are 420. Getting from one to the other by tempo would mean dragging the click from 70 to 140 and living through every broken tempo in between. By changing the subdivision instead, you get the fast motion immediately, in a context where you know exactly where the beat is because it never moved.

The slow pass resets the motion. The fast pass pushes it. And because the pulse is constant, drift in the fast pass is obvious: you hear it against a reference that did not shift. That matters more than it sounds, because the thing that actually predicts whether practice sticks is how precisely you locate an error, not how many times you repeat the passage.

Put the two ideas together and you get what I actually practise now. Three notes, one string, ratio training against a fixed pulse, and string changes only once the hands are locked.

## What I could not find

I wanted an app that would do this. One BPM, two subdivisions, a configurable number of bars on each, a beat or two of rest between so my picking hand could reset, and a count-in so round one was not a guess.

Every metronome app I tried did tempo ramps. Some did subdivisions. None would alternate two subdivisions against a fixed pulse with independent bar counts, which is the one thing I needed.

So I built it. That is the ratios mode, and it is why this is called Ratio·9 rather than something with "metronome" in the name. Progressive tempo is still in there, because tempo ladders have their place. It is just not the headline, and it is not what moved my wall.

## The honest version of how this got made

I have spent thousands of euros on in-person guitar teachers and hundreds more on online courses. I could have simply subscribed to NathanGuitar's course and used his ratio speed trainer, and it would have been cheaper than the hours that went into this.

But I needed a project to test a new Pi-based agent harness I had been building, and this was the itch that was closest to the surface. So I started implementing it one night, and here we are.

That is the actual causal chain. A practice problem I genuinely have, plus wanting a real piece of software rather than a toy to put a new toolchain through its paces.

## It is open source

The whole thing is MIT licensed and on [GitHub](https://github.com/frankbirzle/ratio9).

Fork it, use it, strip it for parts. If you find a bug, open an issue or send a pull request. If you want a feature, the same. I would rather this be useful to other people stuck at the same wall than keep it to myself, and the code is small enough that adding a mode is genuinely approachable.

## One caveat, plainly

This is not a hack that skips the work. It reorganises the work. You still have to put in the hours, still have to stay relaxed, still have to stop when a passage is failing the same way in the same place rather than grinding it. The ratio is a better tool for finding the fast motion, not a substitute for looking after your hands.

If you want the practice framework I use around it, [the three zones](/articles/the-three-zones) is the piece to read next.
