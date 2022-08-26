# share_screen_to_pdf
Web application to extract the presentation slides from a video or online video conference.

## Using
Clone the repository and open `index.html` in your favorite web browser (tested in Google Chrome).
Press the start button to begin.

## Motivation
This project was born in the summer of 2020, just as COVID 19 moved my college classes into an online format.
The presentation slides in a class are an invaluable tool to learn, especially with the professors annotations. 

The goal of this project is to extract the presentation slides from online meetings, especially with the annotations intact.
It should be done fully automatically, with at most a one time configeration step. 
We also want to leverage as much of the browsers inbuilt capabilities as possible.

## Challenge

Classes occur in a variety of hosts (Google Meet, Zoom, MS Teams, etc). 
Each can have multiple layouts. We need to extract the main video stream from each.
This is currently done manually, and a GUI element should be created to enable this.

The slide capture itself needs to happen. 
We need to understand when new slides are brought up, ignore any moving objects in front of it, update the saved slide when annotations are added.
Currently a heuristic method is used that depends on defining a background and measuring changing pixels.

## TODO

- Layout detection or auto bounding box creation
- Improve the core slide capture algorithm, decrease the sensitivity to parameters
- Look into computer vision based solutions
- Clean up the overall interface
- A lot more!
