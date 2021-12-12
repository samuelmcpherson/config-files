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
#include "secthread.h"
#include "iostream"
#include "QProcess"
#include <QDateTime>
#include "config.h"

using namespace std;

extern bool isPressed;
extern bool gestureUp;
extern bool gestureDown;
extern bool gestureLeft;
extern bool gestureRight;
extern long double downTime;
extern long double upTime;
extern long pressX;
extern long pressY;
extern long x;
extern long y;


SecThread::SecThread()
{

}

void SecThread::run()
{
    thread()->setTerminationEnabled(true);
    exec();
}

int SecThread::exec()
{
    while(true)
    {
        unsigned long sleepTime = 100;
        long movX = pressX-x;
        long movY = pressY-y;
        if(gestureUp)
        {
            if(movX<0) movX = -movX;
            if (movY < -cfg->swipeDistanceY and movX < cfg->swipeToleranceY)
            {
                if(cfg->swipeTop)
                    QProcess::execute(cfg->swipeTopCmd);
                cout << "Swipe from top deteced" << endl;
                gestureUp = false;
            }
            if(movY<0) movY = -movY;
            if (QDateTime::currentMSecsSinceEpoch() - downTime < cfg->slideTimeout
                    and movY < cfg->slideToleranceX and movX > cfg->slideDistanceX)
            {
                if(cfg->slideTop)
                    QProcess::execute(cfg->slideTopCmd);
                cout << "Slide on top deteced" << endl;
                gestureUp = false;
            }
            if(QDateTime::currentMSecsSinceEpoch() - downTime > 5000)
            {
                //cout << "Long press on top edge deteced" << endl;
                gestureUp = false;
            }
        }
        if(gestureDown)
        {
            if(movX<0) movX = -movX;
            if (movY > cfg->swipeDistanceY and movX < cfg->swipeToleranceY)
            {
                if(cfg->swipeBottom)
                    QProcess::execute(cfg->swipeBottomCmd);
                cout << "Swipe from bottom deteced" << endl;
                gestureDown = false;
            }
            if(movY<0) movY = -movY;
            if (QDateTime::currentMSecsSinceEpoch() - downTime < cfg->slideTimeout
                    and movY < cfg->slideToleranceX and movX > cfg->slideDistanceX)
            {
                if(cfg->slideBottom)
                    QProcess::execute(cfg->slideBottomCmd);
                cout << "Slide on bottom deteced" << endl;
                gestureDown = false;
            }
            if(QDateTime::currentMSecsSinceEpoch() - downTime > 5000)
            {
                //cout << "Long press on bottom edge deteced" << endl;
                gestureDown = false;
            }
        }
        if(gestureLeft)
        {
            if(movY<0) movY = -movY;
            if (movX < -cfg->swipeDistanceX and movY < cfg->swipeToleranceX)
            {
                if(cfg->swipeLeft)
                    QProcess::execute(cfg->swipeLeftCmd);
                cout << "Swipe from left deteced" << endl;
                gestureLeft = false;
            }
            if(movY<0) movX = -movX;
            if (QDateTime::currentMSecsSinceEpoch() - downTime < cfg->slideTimeout
                    and movY > cfg->slideDistanceY and movX < cfg->slideToleranceY)
            {
                if(cfg->slideLeft)
                    QProcess::execute(cfg->slideLeftCmd);
                cout << "Slide on left deteced" << endl;
                gestureLeft = false;
            }
            if(QDateTime::currentMSecsSinceEpoch() - downTime > 5000)
            {
                //cout << "Long press on left edge deteced" << endl;
                gestureLeft = false;
            }
        }
        if(gestureRight)
        {
            if(movY<0) movY = -movY;
            if (movX > cfg->swipeDistanceX and movY < cfg->swipeToleranceX)
            {
                if(cfg->swipeRight)
                    QProcess::execute(cfg->swipeRightCmd);
                cout << "Swipe from right deteced" << endl;
                gestureRight = false;
            }
            if(movY<0) movX = -movX;
            if (QDateTime::currentMSecsSinceEpoch() - downTime < cfg->slideTimeout
                    and movY > cfg->slideDistanceY and movX < cfg->slideToleranceY)
            {
                if(cfg->slideRight and pressX < cfg->screenX-cfg->sliderSize)
                    QProcess::execute(cfg->slideRightCmd);
                cout << "Slide on right deteced " << endl;
                gestureRight = false;
            }
            if(QDateTime::currentMSecsSinceEpoch() - downTime > 5000)
            {
                //cout << "Long press on right edge deteced" << endl;
                gestureRight = false;
            }
        }
        if(cfg->holdForRMB and
                isPressed and
                QDateTime::currentMSecsSinceEpoch() - upTime > cfg->tapAndMoveTime)
        {
            if(movX<0) movX = -movX;
            if(movY<0) movY = -movY;


            if(movX > cfg->holdTolerance or movY > cfg->holdTolerance)
            {
                isPressed = false;
            }

            if(QDateTime::currentMSecsSinceEpoch() - downTime > cfg->holdTime)
            {
                bool blacklist = false;
                QProcess proc;
                proc.start("xdotool getactivewindow");
                proc.waitForFinished(100);
                QString activeWindow = proc.readLine();

                for(int i=0;i<cfg->blacklist.count();i++)
                {
                    proc.start("xdotool search \"" + cfg->blacklist.at(i) + "\"");
                    proc.waitForFinished(1000);
                    if(QString(proc.readAll()).contains(activeWindow))
                    {
                        cout << "Active window is on blacklist" << endl;
                        blacklist = true;
                    }
                }

                if(cfg->holdForRMB and !blacklist)
                    QProcess::execute("xdotool click 3");
                cout << "Long press deteced" << endl;
                isPressed = false;
            }
        }
        if(cfg->tapAndMove and
                QDateTime::currentMSecsSinceEpoch() - upTime < cfg->tapAndMoveTime and
                isPressed)
        {
            bool blacklist = false;
            QProcess proc;
            proc.start("xdotool getactivewindow");
            proc.waitForFinished(100);
            QString activeWindow = proc.readLine();

            for(int i=0;i<cfg->blacklist.count();i++)
            {
                proc.start("xdotool search \"" + cfg->blacklist.at(i) + "\"");
                proc.waitForFinished(1000);
                if(QString(proc.readAll()).contains(activeWindow))
                {
                    cout << "Active window is on blacklist" << endl;
                    blacklist = true;
                }
            }

            if(!blacklist)
            {
                upTime = QDateTime::currentMSecsSinceEpoch();

                if(movY < -cfg->tapAndMoveTolerance)
                {
                    QProcess::execute("xdotool click 4");
                    cout << "Tap&Move down: " << movY << endl;
                }
                if(movY > cfg->tapAndMoveTolerance)
                {
                    QProcess::execute("xdotool click 5");
                    cout << "Tap&Move up: " << movY << endl;
                }
                QProcess::execute("xdotool keyup 1");
                sleepTime=cfg->scrollInterval;
            }
        }
       thread()->msleep(sleepTime);
    }
}
