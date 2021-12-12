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
#include "devreader.h"

devReader::devReader(QLineEdit *output, QProcess *devTest)
{
    this->output = output;
    this->devTest = devTest;
}

void devReader::run()
{
    thread()->setTerminationEnabled(true);
    exec();
}

int devReader::exec()
{
    while(true)
    {
        QString line;
        while(!devTest->atEnd())
            line = QString(devTest->readLine());
        if(line != "")
            output->setText(line);
        thread()->msleep(100);
    }
}
