/****************************************************************************
 **
 ** Copyright 2019 Piotr Grosiak     Kenlin.pl Polska
 **
 ** This file is part of TouchscreenExtras.
 **
 **  TouchscreenExtras is free software: you can redistribute it and/or modify
 **  it under the terms of the GNU General Public License as published by
 **  the Free Software Foundation, either version 3 of the License, or
 **  (at your option) any later version.
 **
 **  TouchscreenExtras is distributed in the hope that it will be useful,
 **  but WITHOUT ANY WARRANTY; without even the implied warranty of
 **  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 **  GNU General Public License for more details.
 **
 **  You should have received a copy of the GNU General Public License
 **  along with this program.  If not, see <http://www.gnu.org/licenses/>
 **
****************************************************************************/
#include "config.h"
#include <QFile>
#include <QDir>
#include <QTextStream>

Config::Config()
{
    //load config
    QFile file(QDir::homePath() + "/.TouchscreenExtras.cfg");

    QString line;
    QString cmd;
    QString arg;
    if ( file.open(QIODevice::ReadWrite) )
    {
        QTextStream stream(&file);
        while(!stream.atEnd())
        {
            line = stream.readLine();

            if(line.front() == "#")
                continue;

            cmd = line.split("=").at(0);
            arg = line.split("=").at(1);
            if(cmd == "screenX")
                screenX = arg.toInt();
            if(cmd == "screenY")
                screenY = arg.toInt();
            if(cmd == "edgeSizeX")
                edgeSizeX = arg.toInt();
            if(cmd == "edgeSizeY")
                edgeSizeY = arg.toInt();

            if(cmd == "holdForRMB")
                holdForRMB = arg == "1";
            if(cmd == "holdTime")
                holdTime = arg.toInt();
            if(cmd == "holdTolerance")
                holdTolerance = arg.toInt();

            if(cmd == "holdLeft")
                holdLeft = arg == "1";
            if(cmd == "holdRight")
                holdRight = arg == "1";
            if(cmd == "holdTop")
                holdTop = arg == "1";
            if(cmd == "holdBottom")
                holdBottom = arg == "1";
            if(cmd == "edgeHoldTime")
                edgeHoldTime = arg.toInt();

            if(cmd == "swipeLeft")
                swipeLeft = arg == "1";
            if(cmd == "swipeRight")
                swipeRight = arg == "1";
            if(cmd == "swipeTop")
                swipeTop = arg == "1";
            if(cmd == "swipeBottom")
                swipeBottom = arg == "1";
            if(cmd == "swipeLeftCmd")
                swipeLeftCmd = arg;
            if(cmd == "swipeRightCmd")
                swipeRightCmd = arg;
            if(cmd == "swipeTopCmd")
                swipeTopCmd = arg;
            if(cmd == "swipeBottomCmd")
                swipeBottomCmd = arg;
            if(cmd == "swipeDistanceX")
                swipeDistanceX = arg.toInt();
            if(cmd == "swipeDistanceY")
                swipeDistanceY = arg.toInt();
            if(cmd == "swipeToleranceX")
                swipeToleranceX = arg.toInt();
            if(cmd == "swipeToleranceY")
                swipeToleranceY = arg.toInt();

            if(cmd == "slideLeft")
                slideLeft = arg == "1";
            if(cmd == "slideRight")
                slideRight = arg == "1";
            if(cmd == "slideTop")
                slideTop = arg == "1";
            if(cmd == "slideBottom")
                slideBottom = arg == "1";
            if(cmd == "slideLeftCmd")
                slideLeftCmd = arg;
            if(cmd == "slideRightCmd")
                slideRightCmd = arg;
            if(cmd == "slideTopCmd")
                slideTopCmd = arg;
            if(cmd == "slideBottomCmd")
                slideBottomCmd = arg;
            if(cmd == "slideTimeout")
                slideTimeout = arg.toInt();
            if(cmd == "slideDistanceX")
                slideDistanceX = arg.toInt();
            if(cmd == "slideDistanceY")
                slideDistanceY = arg.toInt();
            if(cmd == "sliderSize")
                sliderSize = arg.toInt();
            if(cmd == "slideToleranceX")
                slideToleranceX = arg.toInt();
            if(cmd == "slideToleranceY")
                slideToleranceY = arg.toInt();

            if(cmd == "tapAndMove")
                tapAndMove = arg == "1";
            if(cmd == "tapAndMoveTolerance")
                tapAndMoveTolerance = arg.toInt();
            if(cmd == "tapAndMoveTime")
                tapAndMoveTime = arg.toInt();
            if(cmd == "scrollInterval")
                scrollInterval = arg.toInt();

            if(cmd == "blacklist")
                blacklist.append(arg);

        }
    }
    file.close();
}
