# Synesthesia Synthesizer

Interface for an augmented reality synthesizer.


## Installation and set up

Ensure you are in this repository and get the required dependencies by running ```npm install```.

## Start

Start the application using ```npm start```.

If you wish to calibrate the camera, DO NOT start the server. Instead you should run this app and select the Calibrate Camera option, where you will be guided through the calibration process. 

If the backend server is already running, you will be able to access the augmented reality synthesizer. In this case selecting Synthesizer will launch a screen to be projected. 

## Testing

Jest tests can be run by first building the repo using ```npm run build``` followed by ```npm test```. Tests can be found in the ```src/__tests__/``` directory, 