# Touchscreen Extras

TouchscreenExtras is a free tool than can provide you with all essential features you need to control your device using touchscreen. It is meant for X11 Linux desktops that do not support some essential touchscreen features. Built for and tested on KDE.

## FEATURES:
- simulate right click on touchscreen long press
- silumate mouse scrolling on tap&move
- two types of gestures for each screen edge
    - swipe - move your finger from screen edge into center
    - slide - move your finger along screen edge
- highly configurable - you can use for ANY actions you can think of and on any device
- connected to XServer - works for any Linux desktop
- GUI tool for simple setup and configuration

## REQUIREMENTS:
- touchscreen (obviesly)
- X11 compatybile desktop
- xinput installed (sudo apt-get install xinput)
- xdotool installed (for right click on long press)
- Qt 5.12.2 (for other version you need to compile yourself)
- amd64 architecture (for other you need to compile yourself)

## INSTALLATION USING GUI TOOL:
- copy everything inside [release](release) folder into your location (anything you like)
- make sure that ConfigTool TouchscreenExtras and RunTouchscreenExtras.sh in release folder have "executable" attribute set
- run ConfigTool
- follow instructions on Device tab
- once you have respond from your device and your screen size set click Apply
- follow CONFIGURATION section

## CONFIGURATION USING GUI TOOL:
1. Basic configuration tab
    - you can set active edges area size
    - you can set long press as right mouse button
    - you can set scroll on tap&move
2. Swipe gestures
    - you can configure swipe gesture reactions
    - you can setup actions for each screen edge
3. Slide gestures
    - you can configure slide gestures reactions
    - you can setup actions for each screen edge
4. Once you are done click Apply and wait 2-3 seconds for service to restart

## RUN USING GUI TOOL:
1. Service will be started when you click Apply or Restart service buttons
2. To start service with system add RunTouchscreenExtras.sh to autostart (might need to set up execution path) <div style="page-break-after: always"></div>


## INSALLATION WITHOUT GUI TOOL:
- copy everything inside amd64 folder into your location (anything you like)
- make sure that TouchscreenExtras and RunTouchscreenExtras.sh in amd64 folder have "executable" attribute set
- add RunTouchscreenExtras.sh to autostart
- copy HOME/.TouchscreenExtras.cfg to your home and hange it's name to .TouchscreenExtras.cfg
- follow CONFIGURATION section (there little chance it will work on defaults)

## CONFIGURATION WITGOUT GUI TOOL:
Config file is [homedir]/.TouchscreenExtras.cfg

1. Get your touchscreen ID from XServer
    - open terminal
    - type xinput
    - see devices listed under Virtual core pointer
    - if you are not sure which device is your touchscreen you can try any device by typing xinput -test [device ID] If you selected right ID lines should appear when you tap your touchscreen. You can end test by pressing Ctrl+C. If not, try another device.
2. Set TouchscreenExtras to read right device
    - open RunTouchscreenExtras.sh in any text editor
    - replace number 15 at second line with your touchscreen ID
3. Set basic device information
    - open terminal
    - type xinput -test [touchscreen ID]
    - move your finger to the right bottom corner to the screen until your device stops registering input
    - read motion a[0]=[number1] a[1]=[number2]
    - in config file replace first line with screenX=[number1] and second with screenY=[number2]
4. Simulate right mouse button on touchscreen long press (optional)
    - change holdForRMB=0 into holdForRMB=1 to activate this features
    - you can set press time by changing value after holdTime= (in miliseconds)
    - you can set movement tolerance by changing value after holdTolerance=
    - you can add windows to blaklist by adding line blacklist=[windowClass]
5. Simulate scrolling on tap&move (optional)
    - change tapAndMove=0 into tapAndMove=1 to activate this features
    - you can set maximum delay between tap and move by changing value after tapAndMoveTime= (in miliseconds)
    - you can set movement tolerance by changing value after tapAndMoveTolerance=
    - you can set scrolling interval by changine value after scrollInterval=
    - you can add windows to blaklist by adding line blacklist=[windowClass]
6. Setup swipe gestures (optional)
    - change value after swipe[edge]= to 1 for these edges you want to enable gestures
    - change values after edgeSizeX= to setup size of active areas for left and right edges
    - change values after edgeSizeY= to setup size of active areas for top and bottom edges
    - change values after swipeDistanceX= to set minimal length of swipe for left and right edges and swipeDistanceY= for top and bottom edges
    - change values after swipeToleranceX= to set vertical movement tolerance for swipe from left and right edges and swipeToleranceY= to set horizontal movement tolerance for swipe from top and bottom edges
    - set values after swipe[edge]Cmd= to commands you want to execute when swipe is detected (defaults show nice way to input keyboard shortcuts)
7. Setup slide gestures (optional)
    - change value after slide[edge]= to 1 for these edges you want to enable gestures
    - change values after edgeSizeX= to setup size of active areas for left and right edges
    - change values after edgeSizeY= to setup size of active areas for top and bottom edges
    - change values after slideDistanceX= to set minimal length of slide for top and bottom edges and slideDistanceY= for left and right edges
    - change values after slideToleranceX= to set vertical movement tolerance for slide on top and bootom edges and slideToleranceY= to set horizontal movement tolerance for slide on left and right edges
    - change value after slideTimeout= to set timeout for slide event (in miliseconds)
    - if you have enabled slide event on right edge you might want to consider adding some margin for this action (this will prevent service from triggering slide event when you are scrolling full screen application) by adding value after sliderSize= 
8. Testing configuration
    - open terminal in your installation folder
    - type ./RunTouchscreenExtras.sh
    - You will be notified on every event that is detected (even if action is disabled).
    - you can end service by pressing ctrl+c

## RUN WITHOUT GUI:
- if you have added RunTouchscreenExtras.sh to autostart service will run automatically (might need to set up execution path)
- if not go to your instalation folder and execute RunTouchscreenExtras.sh
- if you want to see output open terminal and then execute RunTouchscreenExtras.sh

