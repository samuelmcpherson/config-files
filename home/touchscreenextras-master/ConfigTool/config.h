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

    int screenX=65000;
    int screenY=65000;
    int edgeSizeX=1;
    int edgeSizeY=1;

    bool holdForRMB=false;
    int holdTime=1;
    int holdTolerance=1;

    bool holdLeft=false;
    bool holdRight=false;
    bool holdTop=false;
    bool holdBottom=false;
    int edgeHoldTime=0;

    bool swipeLeft=false;
    bool swipeRight=false;
    bool swipeTop=false;
    bool swipeBottom=false;
    QString swipeLeftCmd="";
    QString swipeRightCmd="";
    QString swipeTopCmd="";
    QString swipeBottomCmd="";
    int swipeDistanceX=1;
    int swipeDistanceY=1;
    int swipeToleranceX=1;
    int swipeToleranceY=1;

    bool slideLeft=false;
    bool slideRight=false;
    bool slideTop=false;
    bool slideBottom=false;
    QString slideLeftCmd="";
    QString slideRightCmd="";
    QString slideTopCmd="";
    QString slideBottomCmd="";
    int sliderSize=0;
    int slideTimeout=0;
    int slideDistanceX=1;
    int slideDistanceY=1;
    int slideToleranceX=1;
    int slideToleranceY=1;

    bool tapAndMove=false;
    int tapAndMoveTolerance=12;
    int tapAndMoveTime=500;
    int scrollInterval=1;

    Config();
    void Save();
};

extern Config *cfg;

#endif // CONFIG_H
