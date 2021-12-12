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
#ifndef CONFIG_H
#define CONFIG_H

#include <QString>
#include <QList>

class Config
{
public:
    QList<QString> blacklist;

    int screenX;
    int screenY;
    int edgeSizeX;
    int edgeSizeY;

    bool holdForRMB;
    int holdTime;
    int holdTolerance;

    bool holdLeft;
    bool holdRight;
    bool holdTop;
    bool holdBottom;
    int edgeHoldTime;

    bool swipeLeft;
    bool swipeRight;
    bool swipeTop;
    bool swipeBottom;
    QString swipeLeftCmd;
    QString swipeRightCmd;
    QString swipeTopCmd;
    QString swipeBottomCmd;
    int swipeDistanceX;
    int swipeDistanceY;
    int swipeToleranceX;
    int swipeToleranceY;

    bool slideLeft;
    bool slideRight;
    bool slideTop;
    bool slideBottom;
    QString slideLeftCmd;
    QString slideRightCmd;
    QString slideTopCmd;
    QString slideBottomCmd;
    int sliderSize=0;
    int slideTimeout;
    int slideDistanceX;
    int slideDistanceY;
    int slideToleranceX;
    int slideToleranceY;

    bool tapAndMove;
    int tapAndMoveTolerance;
    int tapAndMoveTime;
    int scrollInterval;

    Config();
};

extern Config *cfg;

#endif // CONFIG_H
