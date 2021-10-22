#!/bin/sh

# Turn capslock into ctrl...
setxkbmap -option "ctrl:nocaps"

# ...but esc when pressed once
killall xcape 2> /dev/null
xcape -e "#66=Escape"

# Turn off the caps lock if on since there is no longer a key for it.
xset -q | grep "Caps Lock:\s*on" && xdotool key Caps_Lock
