# drivindave
Exploring neural networks and the genetic algorithm in a couple of my blogs (all in Dutch): 

The post containing this code:
- https://www.ontdeksels.nl/ontdeksel-22-daves-revenge/

Previous posts:
- https://www.ontdeksels.nl/ontdeksel-20-nerdy-norah/
- https://www.ontdeksels.nl/ontdeksel-18-flaming-freddy/
- https://www.ontdeksels.nl/ontdeksel-16-drivin-dave/
- https://www.ontdeksels.nl/ontdeksel-14-de-pijlenrace-naar-de-grens/.

![Demo screenshot](https://github.com/gkruiger/drivindave/blob/master/screenshot.png "Demo screenshot")

## Your own track
You can upload your own track. Please make sure your track adheres to the following:
- Size: 700x700 pixels
- Track itself is in pure black (#000000)
- Start/finish is in pure red (#ff0000). The code assumes the initial direction is to the right.
- Rest is in pure white (#ffffff)

## Tweaking the algoritm
If you're familiar (or want to become familiar) with the parameters you can adjust in the genetic algoritgm, find the following lines of code in the source:

```
var trackFile = 'dijon.svg';            // Default track filename
var revertStartingDirection = false;    // Set it to true if you want start going left
var size = 100;                         // Population size
var bits = 4;                           // Number of bits each gene/config variable has
var mutationChance = 0.10;              // Change each bit in each gene/config variable has to swap from 0 to 1 or from 1 to 0
var maxGenerations = 25;                // Maximum number of generations/rounds
```

If you want to see what these variables do, just play with it. If you want to ready more after that, Google is your friend. My blogs won't help you here, because I tried to stay away from all this stuff (it's complicated enough already).