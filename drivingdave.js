'use strict';

// The Track module
var Track = function(trackCanvas, trackFile) {
    
    // Set constants
    const startAndFinishColor = {
        red: 255,
        green: 0,
        blue: 0
    }
    const offTrackColor = {
        red: 255,
        green: 255,
        blue: 255
    }
    const sensorWidth = 2;
    const sensorColor = '#ffff00';

    // Set context
    var trackContext = trackCanvas.getContext('2d');    
    trackContext.fillStyle = 'rgb(' + offTrackColor.red + ', ' + offTrackColor.green + ', ' + offTrackColor.blue + ')';
    
    // Initialize variables
    var trackImage = new Image();
    var pixels;
    var startAndFinishCoordinates;
    var startingDirection;

    // Load track
    trackImage.src = trackFile;
    trackImage.onload = function() {
        onloadTrackImage();
    }

    // Load the track from the selected file
    function loadTrack(files) {
        // Read the file
        var fr = new FileReader();
        fr.onload = function () {
            trackImage.src = fr.result;
        }
        fr.readAsDataURL(files[0]);

        // And process the file
        trackImage.onload = function() {
            onloadTrackImage();
        }
    }

    // Stuff to do after the track image is loaded
    function onloadTrackImage() {
        // Draw the track immediately
        paint();

        // Instead of grabbing the pixel(s) each move, grab the screen now...
        pixels = trackContext.getImageData(0, 0, trackCanvas.width, trackCanvas.height).data;        

        // Search for the start/finish coordinates
        setStartAndFinishCoordinatesAndDirection();
    }

    // Draw the track
    function paint() {
        // Clear the canvas
        trackContext.fillStyle = 'rgb(' + offTrackColor.red + ', ' + offTrackColor.green + ', ' + offTrackColor.blue + ')';
        trackContext.fillRect(0, 0, trackCanvas.width, trackCanvas.height);

        // Resize image if necessary
        // Check if the image has the same width/height ratio
        let canvasRatio = trackCanvas.width/trackCanvas.height;
        let imageRatio = trackImage.width/trackImage.height;
        let width;
        let height;
        if (imageRatio == canvasRatio) {
            // Yep, same ratio, so draw it, possible resize included
            width = trackCanvas.width;
            height = trackCanvas.height;
        } else {
            // No the same ratio...
            if (imageRatio > canvasRatio) {
                // Fit image to track height
                width = trackCanvas.width;
                height = trackCanvas.width / imageRatio;
            } else {
                // Fit image to track width
                width = trackCanvas.height * imageRatio;
                height = trackCanvas.height;
            }
        }
        trackContext.drawImage(trackImage, 0, 0, width, height);
    }

    // Finds and the start/finish position (x, y) along with the starting direction
    function setStartAndFinishCoordinatesAndDirection() {

        var coordinates = [];
        // Loop trough the pixels and find the red ones      
        for (let y=0; y<trackCanvas.height; y++) {
            for (let x=0; x<trackCanvas.width; x++) {
                // Red?
                let pixel = getPixel(x, y);
                if (
                    pixel.red == startAndFinishColor.red &&
                    pixel.green == startAndFinishColor.green &&
                    pixel.blue == startAndFinishColor.blue
                ) {
                    // Add coordinate to array
                    let coordinate = {
                        x: x,
                        y: y
                    }
                    coordinates.push( coordinate );
                }
            }
        }
        
        // Take the avarage first and last coordinates as the start/finish
        let first = coordinates[ 0 ];
        let last = coordinates[ coordinates.length-1 ];

        startAndFinishCoordinates = {
            x: (first.x + last.x) / 2,
            y: (first.y + last.y) / 2
        }

        // Set the starting direction
        let divX = last.x - first.x;
        let divY = last.y - first.y;
        startingDirection = Math.atan(divY/divX) - Math.PI/2;
        if (revertStartingDirection) {
            startingDirection = startingDirection + Math.PI;
        }
    }

    // Just returns the coordinates
    function getStartAndFinishCoordinates() {
        return startAndFinishCoordinates;
    }

    // Just returns the starting direction
    function getStartingDirection() {
        return startingDirection;
    }

    // Check if the car is crashed
    // By checking if the car is on a pixel with the off track color
    function isChrashed(x, y) {
        if ( hasColor(x, y, {red: offTrackColor.red, green: offTrackColor.green, blue: offTrackColor.blue}) ) {
            return true;
        } else {
            return false;
        }
    }

    // Check if the car is finished
    // By checking if the car is on a pixel with a start and finish color
    function isFinished(x, y) {
        if ( hasColor(x, y, {red: startAndFinishColor.red, green: startAndFinishColor.green, blue: startAndFinishColor.blue}) ) {
            return true; 
        } else {
            return false;
        }
    }

    // Check if the x, y position on the track has the color 
    function hasColor(x, y, color) {
        // Get the pixel
        let pixel = getPixel(x, y);

        // Do the match
        if (
            pixel.red == color.red &&
            pixel.green == color.green &&
            pixel.blue == color.blue 
        ) {
            return true;
        } else {
            return false;
        }
    }

    // Returns the RGB values of a pixel for a x,y coordinate
    function getPixel(x, y) {
        // Beware for floating point values :)
        x = Math.ceil(x);
        y = Math.ceil(y);

        // Get the pixel from the preloaded array
        let pixel = {
            red: pixels[ ((x+y*trackCanvas.width) * 4) + 0 ],
            green: pixels[ ((x+y*trackCanvas.width) * 4) + 1 ],
            blue: pixels[ ((x+y*trackCanvas.width) * 4) + 2 ]
        }
        return pixel;
    }

    // Returns the distance between the coordinates and the 'wall'
    function getSensor(x, y, angle, dontDrawIt) {
        // Starts at the given position and goes along the given angle until it finds a pixel with the off track color
        for (let i=0; i<trackCanvas.width; i++) {

            // Calculate position of the next pixel based in angle and step
            let xNew = Math.floor(x + Math.cos(angle) * i);
            let yNew = Math.floor(y + Math.sin(angle) * i);

            // Check if it's offtrack color
            if ( hasColor(xNew, yNew, {red: offTrackColor.red, green: offTrackColor.green, blue: offTrackColor.blue}) ) {
                if (dontDrawIt) {
                    track.trackContext.lineWidth = sensorWidth;
                    track.trackContext.strokeStyle = sensorColor;
                                
                    track.trackContext.beginPath();   
                    track.trackContext.moveTo(x, y)
                    track.trackContext.lineTo(xNew, yNew);
                    track.trackContext.stroke();
                }
                    
                // Return distance to it
                return Math.floor(
                    Math.sqrt(
                        Math.pow(
                            (x - xNew),2 
                        ) +
                        Math.pow(
                            (y - yNew),2 
                        )
                    )
                );
            }
        }   
    }

    // Public variables & functions
    return {
        trackContext: trackContext,
        loadTrack: loadTrack,
        paint: paint,
        getStartAndFinishCoordinates: getStartAndFinishCoordinates,
        getStartingDirection: getStartingDirection,
        isChrashed: isChrashed,
        isFinished: isFinished,
        getSensor: getSensor,
    }
}

// The car module
var Car = function(track, network, best) {

    // Initialize variables
    var length = 16;
    var width = 4;
    var color = 'blue';
    var bestColor = 'green';
    var startingDirection = track.getStartingDirection();
    var maxWeel = ((Math.PI*2) / 360) * 3;
    var maxSpeed = 10;
    var steps = 0;

    // Initilize variables
    var direction = startingDirection
    var position = {
        x: track.getStartAndFinishCoordinates().x - (length/2 * Math.cos(direction)), // Correction to make sure the car is behind 
        y: track.getStartAndFinishCoordinates().y - (length/2 * Math.sin(direction))  // the finish, not on it.
    }                
    var wheel = 0;
    var speed = 1;
    var isMoving = true;
    var finished = false;

    // Draw the car immediately
    paint();

    // Draw the car
    function paint() {
        track.trackContext.lineWidth = width;
        // Different color if it's the best car of the previous generation
        if (best) {
            track.trackContext.strokeStyle = bestColor; 
        } else {
            track.trackContext.strokeStyle = color; 
        }

        // Save context
        track.trackContext.save();

        // Rotate the car
        track.trackContext.translate(position.x, position.y);
        track.trackContext.rotate(direction);
        
        // Draw the car
        track.trackContext.beginPath();   
        track.trackContext.moveTo(-length/2, 0)
        track.trackContext.lineTo(+length/2, 0);
        track.trackContext.stroke();

        // Restore context
        track.trackContext.restore();
    }

    // Moves the car
    function moveIt() {
        // Only if the car isn't crashed or finished yet
        if (isMoving) {
            let left = getSensorLeft();
            let right = getSensorRight();
            let front = getSensorFront();

            switch(network.goLeftOrRight(left, right, front/10, speed*10 )) {
                case 'right': steerLeft(); break;
                case 'left': steerRight(); break;
                case 'middle': steerMiddle(); break;
            }

            switch(network.brakeOrGas(left, right, front/10, speed*10 )) {
                case 'brake': hitTheBrake(); break;
                case 'gas': hitTheGas(); break;
                case 'none': break;
            }

            // Turn the car
            direction = direction + wheel;
            if (direction >= Math.PI*2) {
                direction =- Math.PI*2;
            } 

            // Move the car
            position.x += speed * Math.cos(direction);
            position.y += speed * Math.sin(direction);
            
            // Paint the car on its new position
            paint();

            // Check if its crashed or finished
            // Only check finished if the car has al least traveled a car distance
            // (to avoid false positives)
            if ( track.isChrashed(position.x, position.y) ) {
                isMoving = false;
                finished = false;
            } else if (steps*speed/10 > length && track.isFinished(position.x, position.y)) {
                isMoving = false;
                finished = true;
            }

            // Update steps
            steps++;
        } else {
            paint();
        }
    }

    // Returns true if the car is not crashed or finished
    // Returns false otherwise
    function getIsMoving() {
        return isMoving;
    }

    // Returns the distance to the end of the track form the cars front with a given angle.
    function getSensorLeft() {
        return track.getSensor(getFrontPosition().x, getFrontPosition().y, direction + (Math.PI * 2) * 7/8);
    }

    // Returns the distance to the end of the track form the cars front with a given angle.
    function getSensorRight() {
        return track.getSensor(getFrontPosition().x, getFrontPosition().y, direction + (Math.PI * 2) * 1/8);
    }

    // Returns the distance to the end of the track form the cars front with a given angle.
    function getSensorFront() {
        return track.getSensor(getFrontPosition().x, getFrontPosition().y, direction + (Math.PI * 2) * 1);
    }

    // Returns the coordinates for the cars front
    function getFrontPosition() {
        return {
            x: position.x + (length/2 * Math.cos(direction)),
            y: position.y + (length/2 * Math.sin(direction))
        }
    }

    // Turn steering wheel to the left 
    function steerLeft() {
        wheel = -maxWeel;
    }

    // Turn steering wheel to the right 
    function steerRight() {
        wheel = +maxWeel;
    }

    // Turn the steering wheel to its middle
    function steerMiddle() {
        wheel = 0;
    }

    // Go faster!
    function hitTheGas() {
        if (speed < maxSpeed) {
            speed++;
        }
    }

    // Slow down
    function hitTheBrake() {
        if (speed > 2) {
            speed--;
        }
    }

    // Returns the fitness score of the car:
    // - Finished is always better than crashed
    // - If finished: less steps are better
    // - If not finished: more steps are better
    function getFitnessScore() {
        if (finished) {
            return +1/steps;
        } else {
            return -1/steps;
        }
    }

    // Just returns the number of steps
    function getSteps() {
        return steps;
    }

    // Just returns the neural network of the car
    function getNetwork() {
        return network;
    }

    // True if the car has finished, false otherwise
    function isFinished() {
        return finished
    }

    // Public functions
    return {
        paint: paint,
        moveIt: moveIt,
        getIsMoving: getIsMoving,
        getFitnessScore: getFitnessScore,
        getNetwork: getNetwork,
        getSteps: getSteps,
        isFinished: isFinished
    }

}

// The population module
var Population = function(track, size, bits, mutationChance) {

    // Array which holds all the cars
    var cars = [];
    var history = [];
    var generation = 0;

    // Convert bits to granularity
    var granularity = Math.pow(2, bits);

    // Populate the population with the given number of cars
    function populate() {

        // A new generation, yay!
        generation++;

        // Check if it's already populated
        if (cars.length == 0 ) {        
            // Not populated. Initialize population randomly.
            setRandomCars();
        } else {
            // Already populated. Get the best two and lay some eggs!
            let topTwoBiasesAndWeights = getTopTwoBiasesAndWeights();
            let combinedTopTwoBiasesAndWeights = combineBiasesAndWeights(topTwoBiasesAndWeights);
            setChildCars(combinedTopTwoBiasesAndWeights, Array.from(topTwoBiasesAndWeights[0]));
        }
    }

    // Creates new cars with random neural networks
    function setRandomCars() {
        cars = [];
        for (let x=0; x<size; x++) {
            cars.push( new Car(track, new NeuralNetwork(granularity)) );
        }
    }

    // Creates new cars based on the parent an mutation chance
    function setChildCars(parent, elite) {
        // Empty the population
        cars = [];
      
        // For every car...
        for (let c=0; c<size-1; c++) {
            let child = [];
            do {
                // ...create a new child
                child = [];
                // For every number of the parent...
                for (let p=0; p<parent.length; p++) {
                    // ...create a slightly mutated number
                    child.push( mutate(parent[p]) );
                } 
            } while (doesChildExistsInHistory(child))

            cars.push( new Car(track, new NeuralNetwork(granularity, child)) );
            addChildToHistory(child);
        } 

        // Push the best (elite) car of the last population last
        cars.push( new Car(track, new NeuralNetwork(granularity, elite), true)  );
    }

    // Duh...
    function addChildToHistory(child) {
        history.push( child );
    }

    // Returns true if the child exists in history, returns false otherwise
    function doesChildExistsInHistory(child) {
        for(let h=0; h<history.length; h++) {
            if (history[h].toString() == child.toString()) {
                return true;
            }
        }
        return false;
    }

    // Returns a slightly mutated number
    function mutate(number) {

        // Convert number to string of 0's and 1's
        let numberInBits = ("0".repeat(bits) + number.toString(2)).substr(-bits);
        let newNumberInBits = "";

        // By chance replace a 0/1 by a 1/0 by chance
        for(let i=0; i<numberInBits.length; i++) {
            if (Math.random() < mutationChance) {
                if (numberInBits.charAt(i) == '1') {
                    newNumberInBits += '0';
                } else {
                    newNumberInBits += '1';
                }
            } else {
                newNumberInBits += numberInBits.charAt(i);
            }
        }

        // Return the number in integer form
        return parseInt(newNumberInBits, 2);
    }

    // Returns the biases and weights of the two cars with the highest fitness scores
    function getTopTwoBiasesAndWeights() {
        // Get the fitness scores and biases & weights of all the cars
        let allScores = [];
        for(let x=0; x<size; x++) {
            allScores.push({
                fitness: cars[x].getFitnessScore(),
                biasesAndWeights: cars[x].getNetwork().getBiasesAndWeights(),
                steps: cars[x].getSteps(),
            });
        }
        
        // Sort them by the fitness score
        allScores.sort(function (a, b) {
            return b.fitness - a.fitness
        });
        
        // Return the first (best) two
        let result = [];
        result.push( allScores[0].biasesAndWeights );
        result.push( allScores[1].biasesAndWeights );

        // Update status before returning the result
        let bestTime = allScores[0].steps/60;
        updateStatus(generation, bestTime);

        return result;
    }

    // Combine (average) two series of biases and weights
    function combineBiasesAndWeights(twoBiasesAndWeights) {
        let result = [];
        
        // Take the average of each value
        for (let i=0; i<twoBiasesAndWeights[0].length; i++) {
            result.push(
                Math.round(
                    (twoBiasesAndWeights[0][i] + twoBiasesAndWeights[1][i]) / 2
                )
            );
        }

        return result;
    }

    // Creates an infinite loop that runs the race for generations to come :)
    function takeAStep() {
        
        track.paint();

        // Move each cars and check if its still moving...
        let carsFinished = 0;
        let carsStillMoving = 0;
        cars.forEach((element) => {
            element.moveIt();
            if (element.isFinished()) {
                carsFinished++;
            }
            if (element.getIsMoving()) {
                carsStillMoving++;
            }
        });

        // If at least two cars have finished, or no cars are moving anymore, repopulate
        if (carsFinished>=2 || carsStillMoving==0) {
            populate();
        }

        if (generation <= maxGenerations) {
            requestAnimationFrame(takeAStep.bind(this));  
        } else {
            // Done. Maximum number of generations achieved
            document.getElementById("start").disabled = false;
            document.getElementById("file").disabled = false;
            cars = undefined;
        }
    }

    // Public functions
    return {
        populate: populate,
        takeAStep: takeAStep
    }

}

// The neural network module
var NeuralNetwork = function(granularity, biasesAndWeights) {

    // Initialize network
    var neurons = [];
    var biasAndWeightsPerNeuron = [];

    const numberOfBiasesAndWeightsPerNeuron = 3+1; // #inputs + 1 bias

    // If biases and weights are given..
    // ..structure these per neuron
    if (biasesAndWeights != undefined) {
        for (let i=0; i<biasesAndWeights.length/numberOfBiasesAndWeightsPerNeuron; i++) {
            let baw = [];
            for (let q=0; q<numberOfBiasesAndWeightsPerNeuron; q++) {
                baw.push(biasesAndWeights[i*numberOfBiasesAndWeightsPerNeuron+q]);
            }
            biasAndWeightsPerNeuron.push( baw );
        }
    }

    // Add the neurons to the network
    neurons.push(
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[0]),
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[1]),
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[2]),
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[3]),
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[4]),
        new Perceptron('sigmoid', numberOfBiasesAndWeightsPerNeuron-1, granularity, biasAndWeightsPerNeuron[5])
    );
    
    // Get steering output from neural network
    function goLeftOrRight(left, right, front, speed) {
        let n0 = neurons[0].getOutput( [left, right, front] );//, speed] );
        let n1 = neurons[1].getOutput( [left, right, front] );//, speed] );
        let n2 = neurons[2].getOutput( [left, right, front] );//, speed] );

        if (n0 > n1 && n0 > n2) {
            return 'left'            
        }
        if (n1 > n0 && n1 > n2) {
            return 'middle'
        }
        if (n2 > n0 && n2 > n1) {
            return 'right'
        }
    }    

    // Get speed control output from neural network
    function brakeOrGas(left, right, front, speed) {
        let n3 = neurons[3].getOutput( [left, right, front] );//, speed] );
        let n4 = neurons[4].getOutput( [left, right, front] );//, speed] );
        let n5 = neurons[5].getOutput( [left, right, front] );//, speed] );

        if (n3 > n4 && n3 > n5) {
            return 'brake'            
        }
        if (n4 > n3 && n4 > n5) {
            return 'none'
        }
        if (n5 > n3 && n5 > n4) {
            return 'gas'
        }
    }     

    // Returns the biases and weights for the neural network
    function getBiasesAndWeights() {
        let numbers = [];

        neurons.forEach((element) => {
            numbers.push( ...element.getBiasesAndWeights() );
        });

        return numbers;
    }

    return {
        goLeftOrRight: goLeftOrRight,
        brakeOrGas: brakeOrGas,
        getBiasesAndWeights : getBiasesAndWeights
    }

}

// One neuron, also called a perception
var Perceptron = function(activationFunction, inputs, granularity, biasAndWeights) {

    // Declare variables
    var minWeight;
    var maxWeight;
    var minBias;
    var maxBias;
    var granularityBias;
    var realBias;
    var granularityWeights = [];
    var realWeights = [];

    // Immediately initialize biases and weights
    initialize();

    // Initialize biases and weights
    function initialize() {
        // Set boundaries based on the activation function
        if (activationFunction=='tanh') {
            minWeight = -2;
            maxWeight = +2;
            minBias = -5;
            maxBias = +5;
        } else if (activationFunction=='sigmoid') {
            minWeight = -1;
            maxWeight = +1;
            minBias = -1;
            maxBias = +1;
        } else {
            // Or throw an error if the activation function is unknown
            throw new Error('Activation function not supported.');
        }

        // Set (random) bias;
        if (biasAndWeights == undefined) {
            granularityBias = getRandomBits();
        } else {
            granularityBias = biasAndWeights[0];
        }
        realBias = translateGranularityToRealNumber(granularityBias, minBias, maxBias);

        // Set (random) weights
        for (let i=0; i<inputs; i++) {
            let granularityWeight;
            if (biasAndWeights == undefined) {
                granularityWeight = getRandomBits();
            } else {
                granularityWeight = biasAndWeights[i+1];
            }
            granularityWeights.push( granularityWeight );
            realWeights.push( translateGranularityToRealNumber(granularityWeight, minWeight, maxWeight) );
        }
    }

    // Translates a number in the range 0..granularity to te givin range min..max
    function translateGranularityToRealNumber(number, min, max) {
        return min + (number/granularity * (max - min)); 
    }

    // Returns a rounded random number between 0 and the granularity 
    function getRandomBits() {
        return Math.round(Math.random()*granularity);
    }

    // Do the actual calculation based on the bias, weights, inputs and the activation function
    function getOutput(inputs) {
        // Calculate weighted sum + bias
        let weightedSum = 0;
        for (let i=0; i<inputs.length; i++) {
            weightedSum += inputs[i] * realWeights[i];
        }
        weightedSum += realBias;

        // Use the activation function
        if (activationFunction=='tanh') {
            return (Math.pow(Math.E, weightedSum) - Math.pow(Math.E, -weightedSum))/(Math.pow(Math.E, weightedSum) + Math.pow(Math.E, -weightedSum));
        } else if (activationFunction=='sigmoid') {
            return (1/(1+Math.pow(Math.E, -weightedSum)));
        } else {
            // Or throw an error if the activation function is unknown
            throw new Error('Activation function not supported.');
        }
    }

    // Returns the bias and weights based on granularity
    function getBiasesAndWeights() {
        let numbers = [];

        numbers.push( granularityBias );
        numbers.push( ...granularityWeights );

        return numbers;
    }

    return {
        getOutput: getOutput,
        getBiasesAndWeights: getBiasesAndWeights
    }

}

// Start a new race
function startNewRace() {

    document.getElementById("start").disabled = true;
    document.getElementById("file").disabled = true;
    updateStatus(1);

    // Create new population
    var population = new Population(track, size, bits, mutationChance);
    population.populate();
    population.takeAStep();
    
};

// Default config
var trackFile = 'dijon.svg';            // Default track filename
var revertStartingDirection = false;    // Set it to true if you want start going left
var size = 100;                         // Population size
var bits = 4;                           // Number of bits each gene/config variable has
var mutationChance = 0.1;               // Change each bit in each gene/config variable has to swap from 0 to 1 or from 1 to 0
var maxGenerations = 25;                // Maximum number of generations/rounds

// Initialize sh*t
var trackCanvas = document.getElementById('trackCanvas');
var track = new Track(trackCanvas, trackFile);
    
// Starting the algoritm
document.getElementById("start").addEventListener("click", startNewRace);

// Upload of an user's own track
document.getElementById("file").addEventListener("change", handleFileChange, false);
function handleFileChange() {
    track.loadTrack(this.files);
}

// Display current generation and best time (in Dutch)
function updateStatus(generation, bestTime) {
    if (generation > maxGenerations) {
        generation = maxGenerations;
    }
    
    let update = "Ronde: " + generation + "/" + maxGenerations + ", beste tijd: ";
    if(bestTime == undefined) {
        update += "-"; 
    } else {
        update += (Math.round(bestTime * 100) / 100).toFixed(2);
    }
    document.getElementById("status").innerHTML = update;
}