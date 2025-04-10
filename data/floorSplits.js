const splitInfo = {
    F1: [
        {
            name: "&cFirst Kill",
            start: /^\[BOSS\] Bonzo: Gratz for making it this far, but I'm basically unbeatable\.$/,
            end: /^\[BOSS\] Bonzo: Oh noes, you got me\.\. what ever will I do\?!$/
        },
        {
            name: "&cSecond Kill",
            end: /^\[BOSS\] Bonzo: Alright, maybe I'm just weak after all\.\.$/
        },
        {
            name: "&eEnd Dialogue"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Bonzo: Gratz for making it this far, but I'm basically unbeatable\.$/
        }
    ],
    F2: [
        {
            name: "&cUndeads",
            start: /^\[BOSS\] Scarf: This is where the journey ends for you, Adventurers\.$/,
            end: /^\[BOSS\] Scarf: Those toys are not strong enough I see\.$/
        },
        {
            name: "&bScarf"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Scarf: This is where the journey ends for you, Adventurers\.$/
        }
    ],
    F3: [
        {
            name: "&9Guardians",
            start: /^\[BOSS\] The Professor: I was burdened with terrible news recently\.\.\.$/,
            end: /^\[BOSS\] The Professor: Oh\? You found my Guardians' one weakness\?$/
        },
        {
            name: "&ePhase 1",
            end: /^\[BOSS\] The Professor: I see\. You have forced me to use my ultimate technique\.$/
        },
        {
            name: "&bPhase 2"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] The Professor: I was burdened with terrible news recently\.\.\.$/
        },
    ],
    F4: [
        {
            name: "&eDialogue",
            start: /^\[BOSS\] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!$/,
            end: /^\[BOSS\] Thorn: Dance! Dance with my Spirit animals! And may you perish in a delightful way!$/
        },
        {
            name: "&bThorn Kill"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!$/
        }
    ],
    F5: [
        {
            name: "&eStart Dialogue",
            start: /^\[BOSS\] Livid: Welcome, you've arrived right on time\. I am Livid, the Master of Shadows\.$/,
            end: /^\[BOSS\] Livid: I respect you for making it to here, but I'll be your undoing\.$/
        },
        {
            name: "&cLivid Kill",
            end: /^\[BOSS\] \w+ Livid: Impossible! How did you figure out which one I was\?!$/
        },
        {
            name: "&eEnd Dialogue"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Livid: Welcome, you've arrived right on time\. I am Livid, the Master of Shadows\.$/
        }
    ],
    F6: [
        {
            name: "&6Terracottas",
            start: /^\[BOSS\] Sadan: So you made it all the way here\.\.\. Now you wish to defy me\? Sadan\?!$/,
            end: /^\[BOSS\] Sadan: ENOUGH!$/
        },
        {
            name: "&dGiants",
            end: /^\[BOSS\] Sadan: You did it\. I understand now, you have earned my respect\.$/
        },
        {
            name: "&cSadan"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Sadan: So you made it all the way here\.\.\. Now you wish to defy me\? Sadan\?!$/,
        }
    ],
    F7: [
        {
            name: "&aMaxor",
            start: /^\[BOSS\] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!$/,
            end: /^\[BOSS\] Storm: Pathetic Maxor, just like expected\.$/
        },
        {
            name: "&bStorm",
            end: /^\[BOSS\] Goldor: Who dares trespass into my domain\?$/
        },
        {
            name: "&eTerminals",
            end: /^The Core entrance is opening!$/
        },
        {
            name: "&7Goldor",
            end: /^\[BOSS\] Necron: You went further than any human before, congratulations\.$/
        },
        {
            name: "&cNecron"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!$/,
        }
    ],
    M7: [
        {
            name: "&aMaxor",
            start: /^\[BOSS\] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!$/,
            end: /^\[BOSS\] Storm: Pathetic Maxor, just like expected\.$/
        },
        {
            name: "&bStorm",
            end: /^\[BOSS\] Goldor: Who dares trespass into my domain\?$/
        },
        {
            name: "&eTerminals",
            end: /^The Core entrance is opening!$/
        },
        {
            name: "&7Goldor",
            end: /^\[BOSS\] Necron: You went further than any human before, congratulations\.$/
        },
        {
            name: "&cNecron",
            end: /^\[BOSS\] Necron: All this, for nothing\.\.\.$/
        },
        {
            name: "&5Dragons"
        },
        {
            name: "&aBoss",
            start: /^\[BOSS\] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!$/,
        }
    ]
}

export default splitInfo