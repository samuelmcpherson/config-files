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
#include <QCoreApplication>
#include <iostream>
#include <thread>
#include <QTextStream>
#include <secthread.h>
#include <QDateTime>
#include "config.h"

using namespace std;

extern bool isPressed;
extern bool gestureDown;
extern bool gestureUp;
extern bool gestureLeft;
extern bool gestureRight;
extern long double downTime;
extern long double upTime;
extern long pressX;
extern long pressY;
extern long x;
extern long y;

bool isPressed = false;
bool gestureDown = false;
bool gestureUp = false;
bool gestureLeft = false;
bool gestureRight = false;
long double downTime = 0;
long double upTime = 0;
long pressX;
long pressY;
long x;
long y;

Config *cfg = new Config();


int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);

    string input;

    SecThread thr;
    thr.start();

    while(cin >> input)
    {

        if(input == "motion")
        {
            QString coord;
            cin >> input;
            coord = QString::fromStdString(input);
            coord = coord.right(coord.length() - 5);
            x = coord.toLong();

            cin >> input;
            coord = QString::fromStdString(input);
            coord = coord.right(coord.length() - 5);
            y = coord.toLong();
            //cout << "moved to " << x << " " << y << endl;
        }
        if(input == "button")
        {
            cin >> input;
            if(input == "press")
            {
                downTime = QDateTime::currentMSecsSinceEpoch();

                QString coord;
                cin >> input >> input;
                coord = QString::fromStdString(input);
                coord = coord.right(coord.length() - 5);
                pressX = coord.toLong();
                x = pressX;


                cin >> input;
                coord = QString::fromStdString(input);
                coord = coord.right(coord.length() - 5);
                pressY = coord.toLong();
                y = pressY;
                isPressed = true;

                gestureDown = y > cfg->screenY-cfg->edgeSizeY;
                gestureUp = y < cfg->edgeSizeY;
                gestureLeft = x < cfg->edgeSizeY;
                gestureRight = x >  cfg->screenX-cfg->edgeSizeX;

                //cout << "Pressed at " << pressX << " " << pressY << endl;
            }
            if(input == "release")
            {
                upTime = QDateTime::currentMSecsSinceEpoch();

                isPressed = false;
                gestureUp = false;
                gestureDown = false;
                gestureLeft = false;
                gestureRight = false;
                //cout << "Released" << endl;
            }
        }
    }
}
